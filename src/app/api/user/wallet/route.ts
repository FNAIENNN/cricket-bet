// src/app/api/user/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { TransactionType, TransactionStatus } from "@prisma/client";
import {
  createTransactionNotes,
  getTelegramContactLink,
  notifyAdmin,
  getDepositMessage,
} from "@/lib/telegram";

/**
 * GET: Fetch user wallet balance and recent transaction history
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const wallet = await prisma.wallet.findUnique({ 
      where: { userId: session.user.id } 
    });
    
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ wallet, transactions });
  } catch (error) {
    console.error("Wallet GET error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
  }
}

/**
 * POST: Create a new deposit transaction and generate Telegram links
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schema = z.object({ 
    amount: z.number().min(100, "Minimum deposit is ₹100").max(100000, "Maximum deposit is ₹1,00,000") 
  });

  try {
    const { amount } = schema.parse(await req.json());

    // 1. Create a descriptive message for the user's Telegram link
    const userMessage = getDepositMessage(amount, "PENDING_ID", session.user.name || "User");
    
    // 2. Create the transaction record first to get a real ID
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: TransactionType.DEPOSIT,
        amount,
        status: TransactionStatus.PENDING,
        // Using the updated naming convention for JSON notes
        notes: createTransactionNotes({
          userMessage: `User initiated a deposit of ₹${amount}`,
        }),
      },
    });

    // 3. Generate the actual contact link now that we have the real ID
    const finalUserMessage = getDepositMessage(amount, transaction.id, session.user.name || "User");
    const redirectUrl = getTelegramContactLink(finalUserMessage);

    // 4. Alert the Admin Bot
    // Matching the TransactionNotificationData interface exactly
    await notifyAdmin({
      transactionId: transaction.id,
      userId: session.user.id,
      userName: session.user.name || "User",
      userEmail: session.user.email || undefined,
      amount: amount,
      type: "DEPOSIT",
      status: "PENDING",
      userMessage: `New deposit request via Wallet Route`,
    });

    return NextResponse.json({
      url: redirectUrl,
      transactionId: transaction.id,
      message: "Deposit initiated. Redirecting to Telegram...",
    });
  } catch (error) {
    console.error("Wallet POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}