import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildExportWorkbook, type ExportMode, type ExportPeriod } from "@/lib/export";
import { resolvePeriod } from "@/lib/period";
import { format, startOfYear, endOfYear } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MODES = new Set(["all", "details", "by-user", "by-doctype", "by-day"]);
const ALLOWED_PERIODS = new Set(["day", "week", "month", "year", "all"]);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") ?? "all") as ExportMode;
  const period = (searchParams.get("period") ?? "month") as ExportPeriod;
  const date = searchParams.get("date") ?? undefined;
  const userId = searchParams.get("userId") || undefined;
  const docTypeId = searchParams.get("docTypeId") || undefined;

  if (!ALLOWED_MODES.has(mode) || !ALLOWED_PERIODS.has(period)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  let start: Date;
  let end: Date;
  let periodLabel: string;
  if (period === "all") {
    start = new Date("1970-01-01");
    end = new Date("2099-12-31T23:59:59.999Z");
    periodLabel = "Toàn bộ";
  } else if (period === "year") {
    const base = date ? new Date(date) : new Date();
    start = startOfYear(base);
    end = endOfYear(base);
    end.setHours(23, 59, 59, 999);
    periodLabel = `Năm ${format(base, "yyyy")}`;
  } else {
    const range = resolvePeriod(period, date, "month");
    start = range.start;
    end = range.end;
    periodLabel = range.label;
  }

  const wb = await buildExportWorkbook({ mode, start, end, periodLabel, userId, docTypeId });
  const buffer = await wb.xlsx.writeBuffer();

  const filename = buildFilename(mode, period, date);

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function buildFilename(mode: string, period: string, date?: string): string {
  const ts = date ?? format(new Date(), "yyyy-MM-dd");
  return `nangsuat-sohoa_${mode}_${period}_${ts}.xlsx`;
}
