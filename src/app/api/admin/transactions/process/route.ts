// src/app/api/admin/transactions/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAdminDecision } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    // Authenticate admin using NextAuth's auth function
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (!session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { transactionId, action, notes } = body;

    // Validate required fields
    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'APPROVE' or 'REJECT'" },
        { status: 400 }
      );
    }

    // Fetch the transaction with user and wallet
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: `Transaction with ID ${transactionId} not found` },
        { status: 404 }
      );
    }

    // Check if transaction is already processed
    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        { error: `Transaction is already ${transaction.status.toLowerCase()}. Cannot process again.` },
        { status: 400 }
      );
    }

    const newStatus = action === "APPROVE" ? "COMPLETED" : "REJECTED";

    // Update transaction notes with admin decision
    const updatedNotes = appendAdminDecision(transaction.notes, {
      action: newStatus as "COMPLETED" | "REJECTED",
      notes: notes || "",
      processedBy: session.user.id,
      processedAt: new Date().toISOString(),
    });

    // Process transaction based on type
    let result;

    try {
      // Use database transaction to ensure consistency
      result = await prisma.$transaction(async (tx) => {
        // Update transaction status
        const updatedTransaction = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: newStatus as any,
            approvedBy: session.user.id,
            approvedAt: new Date(),
            notes: updatedNotes,
          },
        });

        // Handle deposit approval - add to wallet balance
        if (action === "APPROVE" && transaction.type === "DEPOSIT") {
          if (transaction.user.wallet) {
            const updatedWallet = await tx.wallet.update({
              where: { userId: transaction.userId },
              data: {
                balance: {
                  increment: transaction.amount,
                },
              },
            });
            console.log(`Wallet updated for user ${transaction.userId}: New balance ${updatedWallet.balance}`);
          } else {
            // Create wallet if it doesn't exist
            await tx.wallet.create({
              data: {
                userId: transaction.userId,
                balance: transaction.amount,
                currency: "INR",
              },
            });
          }
        }
        
        // For withdrawals, we don't deduct balance here as it's already deducted when request was made
        
        return updatedTransaction;
      });
      
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Database error occurred while processing transaction. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Transaction ${action.toLowerCase()}d successfully`,
      transaction: {
        id: result.id,
        status: result.status,
        amount: transaction.amount,
        type: transaction.type,
      },
    });
    
  } catch (error: any) {
    console.error("Unexpected error processing transaction:", error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}