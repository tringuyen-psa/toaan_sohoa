import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, pagesPerHour } from "@/lib/utils";
import { PagesByUserChart, DocTypePieChart } from "@/components/dashboard/charts";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { resolvePeriod } from "@/lib/period";
import { userColor } from "@/lib/colors";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { period?: string; date?: string };
}) {
  await requireAdmin();
  const range = resolvePeriod(searchParams.period, searchParams.date, "month");

  const entries = await prisma.productivityEntry.findMany({
    where: { workDate: { gte: range.start, lte: range.end } },
    include: {
      user: { select: { id: true, name: true } },
      docType: { select: { id: true, name: true } },
    },
  });

  type Acc = { id: string; name: string; records: number; pages: number; uploaded: number; errors: number; hours: number };
  const byUser = new Map<string, Acc>();
  const byDocType = new Map<string, Acc>();

  for (const e of entries) {
    const uk = e.user.id;
    if (!byUser.has(uk))
      byUser.set(uk, { id: uk, name: e.user.name, records: 0, pages: 0, uploaded: 0, errors: 0, hours: 0 });
    addEntry(byUser.get(uk)!, e);

    const dk = e.docType.id;
    if (!byDocType.has(dk))
      byDocType.set(dk, { id: dk, name: e.docType.name, records: 0, pages: 0, uploaded: 0, errors: 0, hours: 0 });
    addEntry(byDocType.get(dk)!, e);
  }

  const userRows = Array.from(byUser.values()).sort((a, b) => b.pages - a.pages);
  const docTypeRows = Array.from(byDocType.values()).sort((a, b) => b.pages - a.pages);

  const totals = userRows.reduce(
    (a, r) => {
      a.records += r.records;
      a.pages += r.pages;
      a.uploaded += r.uploaded;
      a.errors += r.errors;
      a.hours += r.hours;
      return a;
    },
    { records: 0, pages: 0, uploaded: 0, errors: 0, hours: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a]">Báo cáo tổng hợp</h1>
          <p className="text-sm text-slate-600">{range.label} • Năng suất theo người và theo loại hồ sơ</p>
        </div>
        <PeriodPicker range={range} />
      </div>

      <KpiCards totals={totals} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PagesByUserChart data={userRows.map((r) => ({ key: r.id, name: r.name, pages: r.pages }))} />
        <DocTypePieChart
          data={docTypeRows.map((r) => ({ name: r.name, value: r.pages }))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theo người ({range.label})</CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryTable rows={userRows} totals={totals} totalLabel={range.totalLabel} firstColumnLabel="Người thực hiện" colorize />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theo loại hồ sơ ({range.label})</CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryTable rows={docTypeRows} totals={totals} totalLabel={range.totalLabel} firstColumnLabel="Loại hồ sơ" />
        </CardContent>
      </Card>
    </div>
  );
}

function addEntry(acc: { records: number; pages: number; uploaded: number; errors: number; hours: number }, e: { numRecords: number; numPages: number; numUploaded: number; numErrors: number; hours: number }) {
  acc.records += e.numRecords;
  acc.pages += e.numPages;
  acc.uploaded += e.numUploaded;
  acc.errors += e.numErrors;
  acc.hours += e.hours;
}

function SummaryTable({
  rows,
  totals,
  totalLabel,
  firstColumnLabel,
  colorize = false,
}: {
  rows: { id: string; name: string; records: number; pages: number; uploaded: number; errors: number; hours: number }[];
  totals: { records: number; pages: number; uploaded: number; errors: number; hours: number };
  totalLabel: string;
  firstColumnLabel: string;
  colorize?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>{firstColumnLabel}</th>
            <th className="text-right">Số HS</th>
            <th className="text-right">Số trang</th>
            <th className="text-right">Upload</th>
            <th className="text-right">Lỗi</th>
            <th className="text-right">Giờ</th>
            <th className="text-right">Trang/giờ</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 italic py-4">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const c = colorize ? userColor(r.id) : null;
              return (
              <tr key={r.id} className={colorize ? "entry-row" : undefined}>
                <td style={c ? { borderLeftColor: c.border } : undefined}>
                  {c ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.border }} />
                      <span style={{ color: c.text }} className="font-medium">{r.name}</span>
                    </span>
                  ) : (
                    <span className="font-medium">{r.name}</span>
                  )}
                </td>
                <td className="text-right">{formatNumber(r.records)}</td>
                <td className="text-right">{formatNumber(r.pages)}</td>
                <td className="text-right">{formatNumber(r.uploaded)}</td>
                <td className="text-right">{formatNumber(r.errors)}</td>
                <td className="text-right">{formatNumber(r.hours, 1)}</td>
                <td className="text-right">{formatNumber(pagesPerHour(r.pages, r.hours))}</td>
              </tr>
              );
            })
          )}
          <tr className="row-week-total">
            <td>▲ {totalLabel}</td>
            <td className="text-right">{formatNumber(totals.records)}</td>
            <td className="text-right">{formatNumber(totals.pages)}</td>
            <td className="text-right">{formatNumber(totals.uploaded)}</td>
            <td className="text-right">{formatNumber(totals.errors)}</td>
            <td className="text-right">{formatNumber(totals.hours, 1)}</td>
            <td className="text-right">{formatNumber(pagesPerHour(totals.pages, totals.hours))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
