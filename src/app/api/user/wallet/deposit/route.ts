// src/app/api/user/wallet/deposit/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTelegramDepositLink, notifyAdmin } from "@/lib/telegram";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount } = await request.json();

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Minimum deposit is ₹100" }, { status: 400 });
    }

    // 1. Create pending deposit transaction in Database
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type: "DEPOSIT",
        status: "PENDING",
        userId: session.user.id,
      },
    });

    // 2. Notify Admin via Telegram Bot
    // Fixed: Added 'type' and 'status' to match TransactionNotificationData interface
    await notifyAdmin({
      transactionId: transaction.id,
      userId: session.user.id,
      userName: session.user.name || "User",
      userEmail: session.user.email || undefined,
      amount: amount,
      type: "DEPOSIT",
      status: "PENDING",
      userMessage: `User initiated a deposit of ₹${amount}`,
    });

    // 3. Generate the direct Telegram chat link for the user
    const telegramLink = getTelegramDepositLink(amount, transaction.id);

    return NextResponse.json({
      success: true,
      telegramLink,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}