// src/app/api/admin/matches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Role, MatchStatus } from "@prisma/client";
import { settleBets, refundBets } from "@/lib/settlement";
import { pusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) throw new Error("Forbidden");
  return session;
}

const updateMatchSchema = z.object({
  title: z.string().min(3).optional(),
  teamA: z.string().min(2).optional(),
  teamB: z.string().min(2).optional(),
  venue: z.string().optional(),
  series: z.string().optional(),
  startTime: z.string().datetime().optional(),
  tossOdds: z.number().min(1).max(5).optional(),
  status: z.enum(["UPCOMING", "LIVE", "TOSS_DONE", "FINISHED", "CANCELLED"]).optional(),
  tossWinner: z.enum(["teamA", "teamB"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      bets: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ match });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateMatchSchema.parse(body);

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    // Special handling: tossWinner set = settle bets
    if (data.tossWinner && !existing.tossWinner) {
      // Update match
      const match = await prisma.match.update({
        where: { id },
        data: {
          tossWinner: data.tossWinner,
          status: MatchStatus.TOSS_DONE,
        },
      });

      // Settle all bets
      const settlement = await settleBets(id, data.tossWinner);

      // Notify match channel
      await pusherServer.trigger(
        PUSHER_CHANNELS.matches,
        PUSHER_EVENTS.matchUpdated,
        { matchId: id, status: "TOSS_DONE", tossWinner: data.tossWinner }
      );

      return NextResponse.json({ match, settlement });
    }

    // Special handling: CANCELLED = refund bets
    if (data.status === "CANCELLED" && existing.status !== "CANCELLED") {
      const match = await prisma.match.update({
        where: { id },
        data: { status: MatchStatus.CANCELLED },
      });
      const refund = await refundBets(id);
      return NextResponse.json({ match, refund });
    }

    // General update (status, time, odds, etc.)
    const updateData: any = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.status) updateData.status = data.status as MatchStatus;

    const match = await prisma.match.update({
      where: { id },
      data: updateData,
    });

    // Notify real-time
    await pusherServer.trigger(
      PUSHER_CHANNELS.matches,
      PUSHER_EVENTS.matchUpdated,
      { matchId: id, status: match.status }
    );

    return NextResponse.json({ match });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await params;

  // Only allow deleting upcoming matches with no bets
  const match = await prisma.match.findUnique({
    where: { id },
    include: { _count: { select: { bets: true } } },
  });

  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (match._count.bets > 0) {
    return NextResponse.json({ error: "Cannot delete match with existing bets. Cancel it instead." }, { status: 400 });
  }

  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ message: "Match deleted" });
}
