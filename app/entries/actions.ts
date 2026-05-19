"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { EntryStatus } from "@prisma/client";

const EntrySchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "Chọn người thực hiện"),
  docTypeId: z.string().min(1, "Chọn loại hồ sơ"),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  numRecords: z.coerce.number().int().min(0),
  numPages: z.coerce.number().int().min(0),
  numUploaded: z.coerce.number().int().min(0),
  numErrors: z.coerce.number().int().min(0),
  status: z.nativeEnum(EntryStatus).default(EntryStatus.DONE),
  note: z.string().max(500).optional().nullable(),
  workdayHours: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
    .refine((v) => v === undefined || (v >= 0 && v <= 24), "Giờ làm phải trong khoảng 0–24"),
});

export type EntryFormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export async function saveEntry(_: EntryFormState, formData: FormData): Promise<EntryFormState> {
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
  const { id, workDate, note, userId, workdayHours, ...rest } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) {
    return { ok: false, message: "Người thực hiện không hợp lệ hoặc đã bị khoá" };
  }

  const workDateObj = new Date(workDate + "T00:00:00.000Z");
  const data = {
    ...rest,
    userId,
    workDate: workDateObj,
    note: note?.trim() || null,
  };

  if (id) {
    const existing = await prisma.productivityEntry.findUnique({ where: { id } });
    if (!existing) return { ok: false, message: "Không tìm thấy bản ghi" };
    await prisma.productivityEntry.update({ where: { id }, data });
  } else {
    await prisma.productivityEntry.create({ data });
  }

  if (workdayHours !== undefined) {
    await prisma.workday.upsert({
      where: { userId_workDate: { userId, workDate: workDateObj } },
      update: { hours: workdayHours },
      create: { userId, workDate: workDateObj, hours: workdayHours },
    });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");
  return { ok: true, message: id ? "Đã cập nhật" : "Đã thêm bản ghi" };
}

export async function deleteEntry(id: string) {
  const existing = await prisma.productivityEntry.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Không tìm thấy" };
  await prisma.productivityEntry.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");
  return { ok: true };
}
