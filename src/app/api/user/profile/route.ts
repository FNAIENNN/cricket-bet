// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  depositLimit: z.number().min(100).nullable().optional(),
  selfExcludeDays: z.number().min(1).max(3650).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());

    const updateData: any = {};
    if (body.depositLimit !== undefined) updateData.depositLimit = body.depositLimit;
    if (body.selfExcludeDays) {
      updateData.isSelfExcluded = true;
      updateData.selfExcludeUntil = new Date(Date.now() + body.selfExcludeDays * 86400000);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, depositLimit: true, isSelfExcluded: true, selfExcludeUntil: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
