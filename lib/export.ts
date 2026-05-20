import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { formatNumber, pagesPerHour } from "@/lib/utils";

export type ExportMode = "all" | "details" | "by-user" | "by-doctype" | "by-day";
export type ExportPeriod = "day" | "week" | "month" | "year" | "all";

export type ExportParams = {
  mode: ExportMode;
  start: Date;
  end: Date;
  periodLabel: string;
  userId?: string;
  docTypeId?: string;
};

const STATUS_LABEL: Record<string, string> = {
  DONE: "Hoàn thành",
  IN_PROGRESS: "Đang làm",
  REVIEW: "Kiểm tra",
};

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E3A8A" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" } };
const TOTAL_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFDE68A" },
};
const TOTAL_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FF1E3A8A" } };
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = THIN_BORDER;
  });
  row.height = 22;
}

function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = TOTAL_FILL;
    cell.font = TOTAL_FONT;
    cell.border = THIN_BORDER;
  });
}

function styleBodyRows(ws: ExcelJS.Worksheet, startRow: number, endRow: number) {
  for (let r = startRow; r <= endRow; r++) {
    ws.getRow(r).eachCell((cell) => {
      cell.border = THIN_BORDER;
      if (typeof cell.value === "number") {
        cell.alignment = { horizontal: "center" };
      }
    });
  }
}

export async function buildExportWorkbook(params: ExportParams): Promise<ExcelJS.Workbook> {
  const { mode, start, end, periodLabel, userId, docTypeId } = params;

  const where = {
    workDate: { gte: start, lte: end },
    ...(userId ? { userId } : {}),
    ...(docTypeId ? { docTypeId } : {}),
  };

  const [entries, workdays] = await Promise.all([
    prisma.productivityEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        docType: { select: { id: true, name: true } },
      },
      orderBy: [{ workDate: "asc" }, { user: { name: "asc" } }, { createdAt: "asc" }],
    }),
    prisma.workday.findMany({
      where: {
        workDate: { gte: start, lte: end },
        ...(userId ? { userId } : {}),
      },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "QT Năng suất Số hóa";
  wb.created = new Date();

  if (mode === "all" || mode === "details") sheetDetails(wb, entries, workdays, periodLabel);
  if (mode === "all" || mode === "by-user") sheetByUser(wb, entries, workdays, periodLabel);
  if (mode === "all" || mode === "by-doctype") sheetByDocType(wb, entries, periodLabel);
  if (mode === "all" || mode === "by-day") sheetByDay(wb, entries, workdays, periodLabel);

  if (mode === "all") sheetWorkdays(wb, workdays, periodLabel);

  return wb;
}

function sheetDetails(
  wb: ExcelJS.Workbook,
  entries: Awaited<ReturnType<typeof prisma.productivityEntry.findMany>> extends infer T ? T : never,
  workdays: { userId: string; workDate: Date; hours: number }[],
  periodLabel: string
) {
  const ws = wb.addWorksheet("Chi tiết bản ghi");
  ws.mergeCells("A1:I1");
  ws.getCell("A1").value = `CHI TIẾT BẢN GHI — ${periodLabel}`;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
  ws.getCell("A1").alignment = { horizontal: "center" };

  ws.columns = [
    { header: "Ngày", key: "date", width: 12 },
    { header: "Người thực hiện", key: "user", width: 24 },
    { header: "Loại hồ sơ", key: "docType", width: 22 },
    { header: "Số HS", key: "records", width: 10 },
    { header: "Số trang đã scan", key: "pages", width: 14 },
    { header: "Số trang đã upload", key: "uploaded", width: 14 },
    { header: "Lỗi", key: "errors", width: 8 },
    { header: "Số giờ làm trong ngày", key: "hours", width: 18 },
    { header: "Trạng thái", key: "status", width: 14 },
    { header: "Ghi chú", key: "note", width: 28 },
  ];
  ws.spliceRows(1, 0, []); // shift columns header to row 2

  const headerRow = ws.getRow(2);
  styleHeaderRow(headerRow);

  // build workday lookup by userId|date
  const hoursMap = new Map<string, number>();
  for (const w of workdays) {
    hoursMap.set(`${w.userId}|${new Date(w.workDate).toISOString().slice(0, 10)}`, w.hours);
  }

  let totRecords = 0, totPages = 0, totUploaded = 0, totErrors = 0;
  const startBody = 3;
  for (const e of entries as any[]) {
    const iso = new Date(e.workDate).toISOString().slice(0, 10);
    const dateStr = `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
    const hours = hoursMap.get(`${e.userId}|${iso}`);
    ws.addRow({
      date: dateStr,
      user: e.user.name,
      docType: e.docType.name,
      records: e.numRecords,
      pages: e.numPages,
      uploaded: e.numUploaded,
      errors: e.numErrors,
      hours: hours ?? null,
      status: STATUS_LABEL[e.status] ?? e.status,
      note: e.note ?? "",
    });
    totRecords += e.numRecords;
    totPages += e.numPages;
    totUploaded += e.numUploaded;
    totErrors += e.numErrors;
  }
  const endBody = ws.rowCount;
  styleBodyRows(ws, startBody, endBody);

  const totalHours = workdays.reduce((s, w) => s + w.hours, 0);
  const totalRow = ws.addRow({
    date: "TỔNG",
    user: "",
    docType: "",
    records: totRecords,
    pages: totPages,
    uploaded: totUploaded,
    errors: totErrors,
    hours: totalHours,
    status: "",
    note: `Năng suất: ${formatNumber(pagesPerHour(totPages, totalHours))} trang/giờ`,
  });
  styleTotalRow(totalRow);
}

function sheetByUser(
  wb: ExcelJS.Workbook,
  entries: any[],
  workdays: { userId: string; workDate: Date; hours: number }[],
  periodLabel: string
) {
  const ws = wb.addWorksheet("Theo người");
  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = `THEO NGƯỜI — ${periodLabel}`;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
  ws.getCell("A1").alignment = { horizontal: "center" };

  ws.columns = [
    { header: "Người thực hiện", key: "user", width: 26 },
    { header: "Số HS", key: "records", width: 10 },
    { header: "Số trang đã scan", key: "pages", width: 16 },
    { header: "Số trang đã upload", key: "uploaded", width: 16 },
    { header: "Lỗi", key: "errors", width: 8 },
    { header: "Tổng giờ làm", key: "hours", width: 14 },
    { header: "Năng suất (trang/giờ)", key: "pph", width: 18 },
  ];
  ws.spliceRows(1, 0, []);
  styleHeaderRow(ws.getRow(2));

  type Acc = { name: string; records: number; pages: number; uploaded: number; errors: number };
  const byUser = new Map<string, Acc>();
  for (const e of entries) {
    if (!byUser.has(e.userId))
      byUser.set(e.userId, { name: e.user.name, records: 0, pages: 0, uploaded: 0, errors: 0 });
    const acc = byUser.get(e.userId)!;
    acc.records += e.numRecords;
    acc.pages += e.numPages;
    acc.uploaded += e.numUploaded;
    acc.errors += e.numErrors;
  }

  const hoursByUser = new Map<string, number>();
  for (const w of workdays) {
    hoursByUser.set(w.userId, (hoursByUser.get(w.userId) ?? 0) + w.hours);
  }

  let tR = 0, tP = 0, tU = 0, tE = 0;
  const startBody = 3;
  const sorted = Array.from(byUser.entries()).sort((a, b) => b[1].pages - a[1].pages);
  for (const [uid, acc] of sorted) {
    const hours = hoursByUser.get(uid) ?? 0;
    ws.addRow({
      user: acc.name,
      records: acc.records,
      pages: acc.pages,
      uploaded: acc.uploaded,
      errors: acc.errors,
      hours,
      pph: pagesPerHour(acc.pages, hours),
    });
    tR += acc.records;
    tP += acc.pages;
    tU += acc.uploaded;
    tE += acc.errors;
  }
  styleBodyRows(ws, startBody, ws.rowCount);

  const totalHours = workdays.reduce((s, w) => s + w.hours, 0);
  const total = ws.addRow({
    user: "TỔNG",
    records: tR,
    pages: tP,
    uploaded: tU,
    errors: tE,
    hours: totalHours,
    pph: pagesPerHour(tP, totalHours),
  });
  styleTotalRow(total);
}

function sheetByDocType(wb: ExcelJS.Workbook, entries: any[], periodLabel: string) {
  const ws = wb.addWorksheet("Theo loại hồ sơ");
  ws.mergeCells("A1:E1");
  ws.getCell("A1").value = `THEO LOẠI HỒ SƠ — ${periodLabel}`;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
  ws.getCell("A1").alignment = { horizontal: "center" };

  ws.columns = [
    { header: "Loại hồ sơ", key: "docType", width: 26 },
    { header: "Số HS", key: "records", width: 10 },
    { header: "Số trang đã scan", key: "pages", width: 16 },
    { header: "Số trang đã upload", key: "uploaded", width: 16 },
    { header: "Lỗi", key: "errors", width: 8 },
  ];
  ws.spliceRows(1, 0, []);
  styleHeaderRow(ws.getRow(2));

  const byDoc = new Map<string, { name: string; records: number; pages: number; uploaded: number; errors: number }>();
  for (const e of entries) {
    if (!byDoc.has(e.docTypeId))
      byDoc.set(e.docTypeId, { name: e.docType.name, records: 0, pages: 0, uploaded: 0, errors: 0 });
    const acc = byDoc.get(e.docTypeId)!;
    acc.records += e.numRecords;
    acc.pages += e.numPages;
    acc.uploaded += e.numUploaded;
    acc.errors += e.numErrors;
  }

  let tR = 0, tP = 0, tU = 0, tE = 0;
  const startBody = 3;
  const sorted = Array.from(byDoc.values()).sort((a, b) => b.pages - a.pages);
  for (const acc of sorted) {
    ws.addRow({
      docType: acc.name,
      records: acc.records,
      pages: acc.pages,
      uploaded: acc.uploaded,
      errors: acc.errors,
    });
    tR += acc.records;
    tP += acc.pages;
    tU += acc.uploaded;
    tE += acc.errors;
  }
  styleBodyRows(ws, startBody, ws.rowCount);

  const total = ws.addRow({ docType: "TỔNG", records: tR, pages: tP, uploaded: tU, errors: tE });
  styleTotalRow(total);
}

function sheetByDay(
  wb: ExcelJS.Workbook,
  entries: any[],
  workdays: { userId: string; workDate: Date; hours: number }[],
  periodLabel: string
) {
  const ws = wb.addWorksheet("Theo ngày");
  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = `THEO NGÀY — ${periodLabel}`;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
  ws.getCell("A1").alignment = { horizontal: "center" };

  ws.columns = [
    { header: "Ngày", key: "date", width: 12 },
    { header: "Số HS", key: "records", width: 10 },
    { header: "Số trang đã scan", key: "pages", width: 16 },
    { header: "Số trang đã upload", key: "uploaded", width: 16 },
    { header: "Lỗi", key: "errors", width: 8 },
    { header: "Tổng giờ làm", key: "hours", width: 14 },
    { header: "Năng suất (trang/giờ)", key: "pph", width: 18 },
  ];
  ws.spliceRows(1, 0, []);
  styleHeaderRow(ws.getRow(2));

  const byDay = new Map<string, { records: number; pages: number; uploaded: number; errors: number }>();
  for (const e of entries) {
    const key = new Date(e.workDate).toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, { records: 0, pages: 0, uploaded: 0, errors: 0 });
    const acc = byDay.get(key)!;
    acc.records += e.numRecords;
    acc.pages += e.numPages;
    acc.uploaded += e.numUploaded;
    acc.errors += e.numErrors;
  }

  const hoursByDay = new Map<string, number>();
  for (const w of workdays) {
    const key = new Date(w.workDate).toISOString().slice(0, 10);
    hoursByDay.set(key, (hoursByDay.get(key) ?? 0) + w.hours);
  }

  let tR = 0, tP = 0, tU = 0, tE = 0;
  const startBody = 3;
  const dayKeys = Array.from(new Set([...byDay.keys(), ...hoursByDay.keys()])).sort();
  for (const k of dayKeys) {
    const acc = byDay.get(k) ?? { records: 0, pages: 0, uploaded: 0, errors: 0 };
    const hours = hoursByDay.get(k) ?? 0;
    ws.addRow({
      date: `${k.slice(8, 10)}/${k.slice(5, 7)}/${k.slice(0, 4)}`,
      records: acc.records,
      pages: acc.pages,
      uploaded: acc.uploaded,
      errors: acc.errors,
      hours,
      pph: pagesPerHour(acc.pages, hours),
    });
    tR += acc.records;
    tP += acc.pages;
    tU += acc.uploaded;
    tE += acc.errors;
  }
  styleBodyRows(ws, startBody, ws.rowCount);

  const totalHours = workdays.reduce((s, w) => s + w.hours, 0);
  const total = ws.addRow({
    date: "TỔNG",
    records: tR,
    pages: tP,
    uploaded: tU,
    errors: tE,
    hours: totalHours,
    pph: pagesPerHour(tP, totalHours),
  });
  styleTotalRow(total);
}

function sheetWorkdays(
  wb: ExcelJS.Workbook,
  workdays: { userId: string; user?: { id: string; name: string }; workDate: Date; hours: number }[],
  periodLabel: string
) {
  const ws = wb.addWorksheet("Giờ làm trong ngày");
  ws.mergeCells("A1:C1");
  ws.getCell("A1").value = `GIỜ LÀM TRONG NGÀY — ${periodLabel}`;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
  ws.getCell("A1").alignment = { horizontal: "center" };

  ws.columns = [
    { header: "Ngày", key: "date", width: 12 },
    { header: "Người", key: "user", width: 26 },
    { header: "Số giờ", key: "hours", width: 10 },
  ];
  ws.spliceRows(1, 0, []);
  styleHeaderRow(ws.getRow(2));

  const startBody = 3;
  const sorted = [...workdays].sort((a, b) => {
    const da = new Date(a.workDate).getTime();
    const db = new Date(b.workDate).getTime();
    if (da !== db) return da - db;
    return (a.user?.name ?? "").localeCompare(b.user?.name ?? "");
  });

  let totalHours = 0;
  for (const w of sorted) {
    const iso = new Date(w.workDate).toISOString().slice(0, 10);
    ws.addRow({
      date: `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`,
      user: w.user?.name ?? "—",
      hours: w.hours,
    });
    totalHours += w.hours;
  }
  styleBodyRows(ws, startBody, ws.rowCount);

  const total = ws.addRow({ date: "TỔNG", user: "", hours: totalHours });
  styleTotalRow(total);
}
