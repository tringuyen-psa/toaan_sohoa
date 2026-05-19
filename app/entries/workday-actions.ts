"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  userId: z.string().min(1),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.coerce.number().min(0).max(24),
});

export async function upsertWorkday(input: {
  userId: string;
  workDate: string;
  hours: number;
}): Promise<{ ok: boolean; message?: string }> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const { userId, workDate, hours } = parsed.data;
  const date = new Date(workDate + "T00:00:00.000Z");

  await prisma.workday.upsert({
    where: { userId_workDate: { userId, workDate: date } },
    update: { hours },
    create: { userId, workDate: date, hours },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");
  return { ok: true };
}
