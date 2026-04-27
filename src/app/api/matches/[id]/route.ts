// src/app/api/matches/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: { _count: { select: { bets: true } } },
  });

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  return NextResponse.json({ match });
}
