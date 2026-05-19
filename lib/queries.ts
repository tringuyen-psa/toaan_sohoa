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

export async function getWorkdaysInRange(start: Date, end: Date) {
  return prisma.workday.findMany({
    where: { workDate: { gte: start, lte: end } },
    include: { user: { select: { id: true, name: true } } },
  });
}

export function sumWorkdayHours(workdays: { hours: number }[]): number {
  return workdays.reduce((s, w) => s + w.hours, 0);
}

export function sumHoursOnDate(workdays: { workDate: Date; hours: number }[], day: Date): number {
  const key = day.toDateString();
  return workdays
    .filter((w) => new Date(w.workDate).toDateString() === key)
    .reduce((s, w) => s + w.hours, 0);
}

export function sumHoursForUserOnDate(
  workdays: { userId: string; workDate: Date; hours: number }[],
  userId: string,
  day: Date
): number {
  const key = day.toDateString();
  return workdays
    .filter((w) => w.userId === userId && new Date(w.workDate).toDateString() === key)
    .reduce((s, w) => s + w.hours, 0);
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

