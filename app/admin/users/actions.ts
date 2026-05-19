"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { Role } from "@prisma/client";

const CreateUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9._-]+$/i, "Chỉ chữ/số/.-_"),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(72),
  role: z.nativeEnum(Role).default(Role.USER),
});

export type ActionState = { ok: boolean; message?: string };

export async function createUser(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = CreateUserSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }
  const { password, ...rest } = parsed.data;
  try {
    await prisma.user.create({
      data: {
        ...rest,
        passwordHash: await bcrypt.hash(password, 10),
        passwordPlain: password,
      },
    });
  } catch (e: any) {
    if (e.code === "P2002") return { ok: false, message: "Tên đăng nhập đã tồn tại" };
    throw e;
  }
  revalidatePath("/admin/users");
  return { ok: true, message: "Đã tạo người dùng" };
}

export async function toggleActive(id: string) {
  await requireAdmin();
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return { ok: false };
  await prisma.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetPassword(id: string, password: string) {
  await requireAdmin();
  if (password.length < 6) return { ok: false, message: "Mật khẩu tối thiểu 6 ký tự" };
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      passwordPlain: password,
    },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateRole(id: string, role: Role) {
  await requireAdmin();
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
  return { ok: true };
}

const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9._-]+$/i, "Chỉ chữ/số/.-_"),
  name: z.string().min(1).max(100),
});

export async function updateUser(id: string, input: { username: string; name: string }): Promise<ActionState> {
  await requireAdmin();
  const parsed = UpdateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  try {
    await prisma.user.update({ where: { id }, data: parsed.data });
  } catch (e: any) {
    if (e.code === "P2002") return { ok: false, message: "Tên đăng nhập đã tồn tại" };
    throw e;
  }
  revalidatePath("/admin/users");
  return { ok: true, message: "Đã cập nhật" };
}

export async function deleteUser(id: string): Promise<ActionState> {
  const session = await requireAdmin();
  if (session.user.id === id) {
    return { ok: false, message: "Không thể xoá tài khoản đang đăng nhập" };
  }
  const entryCount = await prisma.productivityEntry.count({ where: { userId: id } });
  if (entryCount > 0) {
    return {
      ok: false,
      message: `User có ${entryCount} bản ghi — chỉ có thể khoá, không xoá được`,
    };
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  return { ok: true, message: "Đã xoá" };
}
