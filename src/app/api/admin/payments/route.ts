// src/app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { appendAdminDecision } from "@/lib/telegram";

/**
 * Helper to ensure only Admins can access these endpoints
 */
async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized: No session found");
  }
  
  // Check if user has admin role
  if (!session.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return session;
}

// GET /api/admin/payments - Get all transactions with Stats
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (type && type !== "all") where.type = type;
    if (status && status !== "all") where.status = status;

    // Fetch transactions with related user and wallet info
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            wallet: { select: { balance: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Fetch Aggregate Statistics for the Admin Dashboard
    const [totalDeposits, totalWithdrawals, pendingData] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: "DEPOSIT", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "WITHDRAWAL", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      transactions,
      stats: {
        totalDeposits: totalDeposits._sum.amount || 0,
        totalWithdrawals: totalWithdrawals._sum.amount || 0,
        pendingCount: pendingData._count.id || 0,
        pendingAmount: pendingData._sum.amount || 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    const status = error.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status });
  }
}

// POST /api/admin/payments - Approve or Reject a transaction
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    const { transactionId, action, notes } = body;

    // Validation
    if (!transactionId || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: { include: { wallet: true } } },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }

    const newStatus = action === "APPROVE" ? "COMPLETED" : "REJECTED";

    // Use the appendAdminDecision function
    const updatedNotes = appendAdminDecision(transaction.notes, {
      action: newStatus as "COMPLETED" | "REJECTED",
      notes: notes || `Action performed: ${action}`,
      processedBy: session.user.id,
      processedAt: new Date().toISOString(),
    });

    // Use a DB Transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: newStatus as any,
          approvedBy: session.user.id,
          approvedAt: new Date(),
          notes: updatedNotes,
        },
      });

      // Wallet Logic:
      // 1. If Deposit is APPROVED -> Add money to wallet
      if (action === "APPROVE" && transaction.type === "DEPOSIT") {
        await tx.wallet.update({
          where: { userId: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        });
      }
      
      // 2. If Withdrawal is REJECTED -> Return money to wallet
      if (action === "REJECT" && transaction.type === "WITHDRAWAL") {
        await tx.wallet.update({
          where: { userId: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        });
      }

      return updatedTx;
    });

    return NextResponse.json({ success: true, transaction: result });
  } catch (error: any) {
    console.error("Error processing payment:", error);
    const status = error.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status });
  }
}