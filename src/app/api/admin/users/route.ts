// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const users = await prisma.user.findMany({
    where: {
      role: Role.USER,
      ...(search ? {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      wallet: { select: { balance: true, currency: true } },
      _count: { select: { bets: true, transactions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// PATCH /api/admin/users — suspend/activate/self-exclude
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, action } = body; // action: "suspend" | "activate"

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (action === "suspend") {
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    return NextResponse.json({ message: "User suspended" });
  }

  if (action === "activate") {
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    return NextResponse.json({ message: "User activated" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
