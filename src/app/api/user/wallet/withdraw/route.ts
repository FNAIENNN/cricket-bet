// src/app/api/user/wallet/withdraw/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTelegramWithdrawLink, notifyAdmin } from "@/lib/telegram";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount, bankDetails } = await request.json();

    if (!amount || amount < 500) {
      return NextResponse.json({ error: "Minimum withdrawal is ₹500" }, { status: 400 });
    }

    // 1. Check wallet balance and deduct funds immediately
    // We use a transaction to ensure the balance is checked and deducted safely
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: session.user.id },
      });

      if (!wallet || wallet.balance < amount) {
        throw new Error("Insufficient balance");
      }

      // Deduct funds from wallet immediately
      await tx.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: amount } },
      });

      // Create pending withdrawal transaction record
      return await tx.transaction.create({
        data: {
          amount,
          type: "WITHDRAWAL",
          status: "PENDING",
          userId: session.user.id,
          // Storing bank details as JSON in the notes field for admin reference
          notes: JSON.stringify({ payoutDetails: bankDetails }),
        },
      });
    });

    // 2. Notify Admin via Telegram Bot
    // Fixed: Mapped 'bankDetails' to 'paymentDetails' and added required fields
    await notifyAdmin({
      transactionId: result.id,
      userId: session.user.id,
      userName: session.user.name || "User",
      userEmail: session.user.email || undefined,
      amount: amount,
      type: "WITHDRAWAL",
      status: "PENDING",
      paymentDetails: bankDetails, // Matches the 'any' type in our interface
      userMessage: `Withdrawal request for ₹${amount}`,
    });

    // 3. Generate Telegram deep link for user
    const telegramLink = getTelegramWithdrawLink(amount, result.id, bankDetails);

    return NextResponse.json({
      success: true,
      telegramLink,
      transactionId: result.id,
    });
  } catch (error: any) {
    console.error("Withdrawal error:", error);
    if (error.message === "Insufficient balance") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}