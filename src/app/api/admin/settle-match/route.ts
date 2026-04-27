import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, winner } = await req.json();

    if (!matchId || !winner || !["teamA", "teamB"].includes(winner)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        bets: {
          where: { status: "PENDING" },
          include: { user: { include: { wallet: true } } },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.settlementTime) {
      return NextResponse.json({ error: "Match already settled" }, { status: 400 });
    }

    let totalWinners = 0;
    let totalLosers = 0;
    let totalPayout = 0;

    await prisma.$transaction(async (tx) => {
      for (const bet of match.bets) {
        const isWinner = bet.selection === winner;
        
        if (isWinner) {
          const payout = bet.amount * bet.odds;
          totalPayout += payout;
          totalWinners++;

          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: "WON",
              payout: payout,
              settledAt: new Date(),
            },
          });

          await tx.wallet.update({
            where: { userId: bet.userId },
            data: {
              balance: { increment: payout },
            },
          });

          await tx.transaction.create({
            data: {
              userId: bet.userId,
              type: "BET_WON",
              amount: payout,
              status: "COMPLETED",
              notes: `Won bet on ${match.teamA} vs ${match.teamB}`,
            },
          });
        } else {
          totalLosers++;
          
          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: "LOST",
              settledAt: new Date(),
            },
          });
        }
      }

      await tx.match.update({
        where: { id: matchId },
        data: {
          tossWinner: winner,
          status: "FINISHED",
          settlementTime: new Date(),
          settledBy: session.user.id,
          settledAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Match settled. ${totalWinners} winners credited with ₹${totalPayout.toLocaleString()}`,
      stats: {
        winners: totalWinners,
        losers: totalLosers,
        totalPayout,
      },
    });
  } catch (error: any) {
    console.error("Settlement error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to settle match" },
      { status: 500 }
    );
  }
}
