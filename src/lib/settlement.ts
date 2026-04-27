// src/lib/settlement.ts
// Core bet settlement logic — called by admin when marking toss result

import { prisma } from "./prisma";
import { BetStatus, TransactionType, TransactionStatus } from "@prisma/client";
import { pusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "./pusher";

/**
 * Settle all bets for a match after toss result is set.
 * This is the most critical business function.
 *
 * Flow:
 *  1. Admin calls PATCH /api/admin/matches/[id] with { tossWinner: "teamA" | "teamB" }
 *  2. This function runs in a DB transaction
 *  3. For each PENDING bet on that match:
 *     - WON bets: credit wallet + create transaction
 *     - LOST bets: just mark as LOST (funds already deducted when placed)
 *  4. Pusher events fired so UI updates in real-time
 */
export async function settleBets(matchId: string, tossWinner: "teamA" | "teamB") {
  // Run everything in a transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Get all pending bets for this match
    const pendingBets = await tx.bet.findMany({
      where: { matchId, status: BetStatus.PENDING },
      include: { user: { include: { wallet: true } } },
    });

    if (pendingBets.length === 0) {
      return { settled: 0, totalPayout: 0 };
    }

    let totalPayout = 0;
    const settledBets = [];

    for (const bet of pendingBets) {
      const won = bet.selection === tossWinner;
      const payout = won ? bet.potential : 0;
      totalPayout += payout;

      // Update bet status
      const updatedBet = await tx.bet.update({
        where: { id: bet.id },
        data: {
          status: won ? BetStatus.WON : BetStatus.LOST,
          payout,
          settledAt: new Date(),
        },
      });

      if (won && bet.user.wallet) {
        // Credit wallet for won bets
        await tx.wallet.update({
          where: { userId: bet.userId },
          data: { balance: { increment: payout } },
        });

        // Create credit transaction record
        await tx.transaction.create({
          data: {
            userId: bet.userId,
            type: TransactionType.BET_WON,
            amount: payout,
            status: TransactionStatus.COMPLETED,
            notes: `Won toss bet on match ${matchId}`,
          },
        });
      }

      settledBets.push(updatedBet);
    }

    return { settled: pendingBets.length, totalPayout, settledBets };
  });

  // Fire real-time events outside transaction
  // Notify the match channel that toss is done
  await pusherServer.trigger(PUSHER_CHANNELS.match(matchId), PUSHER_EVENTS.tossDone, {
    matchId,
    tossWinner,
    settledCount: result.settled,
  });

  // Notify individual users of bet settlement
  for (const bet of result.settledBets ?? []) {
    try {
      await pusherServer.trigger(
        PUSHER_CHANNELS.user(bet.userId),
        PUSHER_EVENTS.betSettled,
        { betId: bet.id, status: bet.status, payout: bet.payout }
      );
    } catch (e) {
      // Pusher notify failure is non-critical
      console.error("Pusher notify error:", e);
    }
  }

  return result;
}

/**
 * Refund all bets for a CANCELLED match.
 */
export async function refundBets(matchId: string) {
  return prisma.$transaction(async (tx) => {
    const pendingBets = await tx.bet.findMany({
      where: { matchId, status: BetStatus.PENDING },
    });

    for (const bet of pendingBets) {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: BetStatus.REFUNDED, payout: bet.amount, settledAt: new Date() },
      });

      await tx.wallet.update({
        where: { userId: bet.userId },
        data: { balance: { increment: bet.amount } },
      });

      await tx.transaction.create({
        data: {
          userId: bet.userId,
          type: TransactionType.BET_REFUND,
          amount: bet.amount,
          status: TransactionStatus.COMPLETED,
          notes: `Refund for cancelled match ${matchId}`,
        },
      });
    }

    return { refunded: pendingBets.length };
  });
}
