import { prisma } from "@/lib/prisma";

export type EntryWithRel = Awaited<ReturnType<typeof getEntriesInRange>>[number];

export async function getEntriesInRange(start: Date, end: Date) {
  return prisma.productivityEntry.findMany({
    where: { workDate: { gte: start, lte: end } },
    include: {
      user: { select: { id: true, name: true, username: true } },
      docType: { select: { id: true, name: true } },
    },
    orderBy: [{ workDate: "asc" }, { user: { name: "asc" } }, { createdAt: "asc" }],
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
      passwordPlain: true,
      createdAt: true,
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function getActiveUsers() {
  return prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function getAllDocTypes() {
  return prisma.documentType.findMany({ orderBy: { name: "asc" } });
}

export async function getActiveDocTypes() {
  return prisma.documentType.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

