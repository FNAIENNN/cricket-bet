// src/app/api/admin/matches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Role } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) {
    throw new Error("Forbidden");
  }
  return session;
}

const createMatchSchema = z.object({
  title: z.string().min(3),
  teamA: z.string().min(2),
  teamB: z.string().min(2),
  venue: z.string().optional(),
  series: z.string().optional(),
  startTime: z.string().datetime(),
  tossOdds: z.number().min(1).max(5).default(1.95),
  teamALogo: z.string().url().optional(),
  teamBLogo: z.string().url().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const matches = await prisma.match.findMany({
    orderBy: { startTime: "desc" },
    include: {
      _count: { select: { bets: true } },
      bets: { select: { amount: true, status: true } },
    },
  });

  // Aggregate stats per match
  const enriched = matches.map((m) => ({
    ...m,
    totalBets: m.bets.length,
    totalStaked: m.bets.reduce((sum, b) => sum + b.amount, 0),
    bets: undefined, // remove raw bets from list
  }));

  return NextResponse.json({ matches: enriched });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createMatchSchema.parse(body);

    const match = await prisma.match.create({
      data: {
        ...data,
        startTime: new Date(data.startTime),
      },
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
