// src/app/api/user/bets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { MatchStatus, TransactionType, TransactionStatus } from "@prisma/client";

const betSchema = z.object({
  matchId: z.string(),
  selection: z.enum(["teamA", "teamB"]),
  amount: z.number().min(10).max(100000),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id, ...(matchId ? { matchId } : {}) },
    include: {
      match: {
        select: { title: true, teamA: true, teamB: true, status: true, tossWinner: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bets });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { matchId, selection, amount } = betSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { wallet: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.isSelfExcluded) {
      if (!user.selfExcludeUntil || user.selfExcludeUntil > new Date()) {
        return NextResponse.json({ error: "Account is self-excluded" }, { status: 403 });
      }
    }
    if (!user.wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 400 });
    if (user.wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (match.status !== MatchStatus.UPCOMING && match.status !== MatchStatus.LIVE) {
      return NextResponse.json({ error: "Betting is closed for this match" }, { status: 400 });
    }

    const existingBet = await prisma.bet.findFirst({
      where: { userId: session.user.id, matchId },
    });
    if (existingBet) {
      return NextResponse.json({ error: "Already bet on this match" }, { status: 400 });
    }

    const odds = match.tossOdds;
    const potential = parseFloat((amount * odds).toFixed(2));

    const [wallet, bet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.bet.create({
        data: { userId: session.user.id, matchId, selection, amount, odds, potential },
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: TransactionType.BET_PLACED,
          amount: -amount,
          status: TransactionStatus.COMPLETED,
          notes: `Bet on ${match.title}`,
        },
      }),
    ]);

    return NextResponse.json({ bet, wallet }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
