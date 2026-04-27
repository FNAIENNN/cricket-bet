// src/app/api/matches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // UPCOMING | LIVE | FINISHED

  const matches = await prisma.match.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { startTime: "asc" },
    include: {
      _count: { select: { bets: true } },
    },
  });

  return NextResponse.json({ matches });
}
