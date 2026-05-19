"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

const Schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  note: z.string().max(255).optional().nullable(),
});

export type ActionState = { ok: boolean; message?: string };

export async function saveDocType(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = Schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const { id, name, note } = parsed.data;
  try {
    if (id) {
      await prisma.documentType.update({ where: { id }, data: { name, note: note || null } });
    } else {
      await prisma.documentType.create({ data: { name, note: note || null } });
    }
  } catch (e: any) {
    if (e.code === "P2002") return { ok: false, message: "Tên đã tồn tại" };
    throw e;
  }
  revalidatePath("/admin/document-types");
  revalidatePath("/entries");
  return { ok: true, message: id ? "Đã cập nhật" : "Đã thêm" };
}

export async function toggleDocTypeActive(id: string) {
  await requireAdmin();
  const dt = await prisma.documentType.findUnique({ where: { id } });
  if (!dt) return { ok: false };
  await prisma.documentType.update({ where: { id }, data: { active: !dt.active } });
  revalidatePath("/admin/document-types");
  return { ok: true };
}

export async function deleteDocType(id: string) {
  await requireAdmin();
  const usedCount = await prisma.productivityEntry.count({ where: { docTypeId: id } });
  if (usedCount > 0) {
    return { ok: false, message: `Đang được dùng bởi ${usedCount} bản ghi — chỉ có thể vô hiệu hoá` };
  }
  await prisma.documentType.delete({ where: { id } });
  revalidatePath("/admin/document-types");
  return { ok: true };
}
