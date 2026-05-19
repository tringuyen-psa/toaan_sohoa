"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { EntryStatus } from "@prisma/client";

const EntrySchema = z.object({
  id: z.string().optional(),
  docTypeId: z.string().min(1, "Chọn loại hồ sơ"),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  numRecords: z.coerce.number().int().min(0),
  numPages: z.coerce.number().int().min(0),
  numUploaded: z.coerce.number().int().min(0),
  numErrors: z.coerce.number().int().min(0),
  hours: z.coerce.number().min(0).max(24),
  status: z.nativeEnum(EntryStatus).default(EntryStatus.DONE),
  note: z.string().max(500).optional().nullable(),
});

export type EntryFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export async function saveEntry(_: EntryFormState, formData: FormData): Promise<EntryFormState> {
  const session = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = EntrySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Dữ liệu không hợp lệ",
      errors: Object.fromEntries(
        parsed.error.issues.map((i) => [i.path[0] as string, i.message])
      ),
    };
  }
  const { id, workDate, note, ...rest } = parsed.data;
  const data = {
    ...rest,
    workDate: new Date(workDate + "T00:00:00.000Z"),
    note: note?.trim() || null,
  };

  if (id) {
    const existing = await prisma.productivityEntry.findUnique({ where: { id } });
    if (!existing) return { ok: false, message: "Không tìm thấy bản ghi" };
    if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return { ok: false, message: "Không có quyền chỉnh sửa bản ghi này" };
    }
    await prisma.productivityEntry.update({ where: { id }, data });
  } else {
    await prisma.productivityEntry.create({ data: { ...data, userId: session.user.id } });
  }

  revalidatePath("/entries");
  revalidatePath("/");
  revalidatePath("/admin/reports");
  return { ok: true, message: id ? "Đã cập nhật" : "Đã thêm bản ghi" };
}

export async function deleteEntry(id: string) {
  const session = await requireUser();
  const existing = await prisma.productivityEntry.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Không tìm thấy" };
  if (existing.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { ok: false, message: "Không có quyền xoá" };
  }
  await prisma.productivityEntry.delete({ where: { id } });
  revalidatePath("/entries");
  revalidatePath("/");
  revalidatePath("/admin/reports");
  return { ok: true };
}
