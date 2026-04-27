// src/app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalUsers,
    activeUsers,
    totalBets,
    pendingBets,
    totalMatches,
    liveMatches,
    pendingWithdrawals,
    revenueData,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", isActive: true } }),
    prisma.bet.count(),
    prisma.bet.count({ where: { status: "PENDING" } }),
    prisma.match.count(),
    prisma.match.count({ where: { status: "LIVE" } }),
    prisma.transaction.count({ where: { type: "WITHDRAWAL", status: "PENDING" } }),
    prisma.bet.aggregate({
      _sum: { amount: true, payout: true },
    }),
  ]);

  // Total staked minus total paid out = gross revenue
  const totalStaked = revenueData._sum.amount ?? 0;
  const totalPaidOut = revenueData._sum.payout ?? 0;
  const grossRevenue = totalStaked - totalPaidOut;

  // Recent bets (last 10)
  const recentBets = await prisma.bet.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      match: { select: { title: true, teamA: true, teamB: true } },
    },
  });

  // Daily bet volume last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dailyBets = await prisma.bet.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: sevenDaysAgo } },
    _sum: { amount: true },
    _count: true,
  });

  return NextResponse.json({
    stats: {
      totalUsers,
      activeUsers,
      totalBets,
      pendingBets,
      totalMatches,
      liveMatches,
      pendingWithdrawals,
      totalStaked,
      totalPaidOut,
      grossRevenue,
    },
    recentBets,
    dailyBets,
  });
}
