"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { DaySession } from "@prisma/client";

const ItemSchema = z.object({
  docTypeId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99999),
});

const HandoverSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, "Nhập loại hồ sơ").max(200),
  recordDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Hồ sơ ngày không hợp lệ"),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày nhận không hợp lệ"),
  receivedTime: z.string().optional().nullable(),
  receivedSession: z.enum(["MORNING", "AFTERNOON", ""]).optional().nullable(),
  handedOverDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày bàn giao không hợp lệ"),
  handedOverTime: z.string().optional().nullable(),
  handedOverSession: z.enum(["MORNING", "AFTERNOON", ""]).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  items: z.array(ItemSchema).min(1, "Thêm ít nhất 1 dòng số lượng"),
});

export type HandoverState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

function combineDateTime(
  date: string,
  time?: string | null,
  session?: "MORNING" | "AFTERNOON" | "" | null
): { at: Date; session: DaySession | null } {
  const hasTime = !!time && /^\d{2}:\d{2}$/.test(time);
  const hhmm = hasTime ? (time as string) : session === "AFTERNOON" ? "14:00" : "08:00";
  const at = new Date(`${date}T${hhmm}:00.000Z`);
  const sess: DaySession | null =
    !hasTime && (session === "MORNING" || session === "AFTERNOON") ? session : null;
  return { at, session: sess };
}

export async function saveHandover(input: unknown): Promise<HandoverState> {
  await requireAdmin();
  const parsed = HandoverSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      errors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join("."), i.message])
      ),
    };
  }

  const d = parsed.data;
  const recv = combineDateTime(d.receivedDate, d.receivedTime, d.receivedSession);
  const hand = combineDateTime(d.handedOverDate, d.handedOverTime, d.handedOverSession);

  const base = {
    category: d.category.trim(),
    recordDate: new Date(d.recordDate + "T00:00:00.000Z"),
    receivedAt: recv.at,
    receivedSession: recv.session,
    handedOverAt: hand.at,
    handedOverSession: hand.session,
    note: d.note?.trim() || null,
  };

  if (d.id) {
    await prisma.$transaction([
      prisma.handoverItem.deleteMany({ where: { handoverId: d.id } }),
      prisma.handover.update({ where: { id: d.id }, data: base }),
      prisma.handoverItem.createMany({
        data: d.items.map((it) => ({
          handoverId: d.id!,
          docTypeId: it.docTypeId,
          quantity: it.quantity,
        })),
      }),
    ]);
  } else {
    await prisma.handover.create({
      data: {
        ...base,
        items: { create: d.items.map((it) => ({ docTypeId: it.docTypeId, quantity: it.quantity })) },
      },
    });
  }

  revalidatePath("/admin/handovers");
  return { ok: true, message: d.id ? "Đã cập nhật" : "Đã thêm bản giao" };
}

export async function deleteHandover(id: string): Promise<HandoverState> {
  await requireAdmin();
  await prisma.handover.delete({ where: { id } });
  revalidatePath("/admin/handovers");
  return { ok: true, message: "Đã xoá" };
}
