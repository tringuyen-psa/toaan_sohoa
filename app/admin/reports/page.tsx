import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { PagesByUserChart, DocTypePieChart } from "@/components/dashboard/charts";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { resolvePeriod } from "@/lib/period";
import { userColor } from "@/lib/colors";
import { getWorkdaysInRange } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { period?: string; date?: string };
}) {
  await requireAdmin();
  const range = resolvePeriod(searchParams.period, searchParams.date, "month");

  const [entries, workdays] = await Promise.all([
    prisma.productivityEntry.findMany({
      where: { workDate: { gte: range.start, lte: range.end } },
      include: {
        user: { select: { id: true, name: true } },
        docType: { select: { id: true, name: true } },
      },
    }),
    getWorkdaysInRange(range.start, range.end),
  ]);

  const hoursByUser = new Map<string, number>();
  for (const w of workdays) {
    hoursByUser.set(w.userId, (hoursByUser.get(w.userId) ?? 0) + w.hours);
  }
  const totalHours = workdays.reduce((s, w) => s + w.hours, 0);

  type Acc = { id: string; name: string; records: number; pages: number; uploaded: number; errors: number };
  const byUser = new Map<string, Acc>();
  const byDocType = new Map<string, Acc>();

  for (const e of entries) {
    const uk = e.user.id;
    if (!byUser.has(uk))
      byUser.set(uk, { id: uk, name: e.user.name, records: 0, pages: 0, uploaded: 0, errors: 0 });
    addEntry(byUser.get(uk)!, e);

    const dk = e.docType.id;
    if (!byDocType.has(dk))
      byDocType.set(dk, { id: dk, name: e.docType.name, records: 0, pages: 0, uploaded: 0, errors: 0 });
    addEntry(byDocType.get(dk)!, e);
  }

  const userRows = Array.from(byUser.values())
    .map((r) => ({ ...r, hours: hoursByUser.get(r.id) ?? 0 }))
    .sort((a, b) => b.pages - a.pages);
  const docTypeRows = Array.from(byDocType.values()).sort((a, b) => b.pages - a.pages);

  const totals = {
    records: userRows.reduce((s, r) => s + r.records, 0),
    pages: userRows.reduce((s, r) => s + r.pages, 0),
    uploaded: userRows.reduce((s, r) => s + r.uploaded, 0),
    errors: userRows.reduce((s, r) => s + r.errors, 0),
    hours: totalHours,
  };

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
          <UserSummaryTable rows={userRows} totals={totals} totalLabel={range.totalLabel} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theo loại hồ sơ ({range.label})</CardTitle>
        </CardHeader>
        <CardContent>
          <DocTypeSummaryTable rows={docTypeRows} totals={totals} totalLabel={range.totalLabel} />
        </CardContent>
      </Card>
    </div>
  );
}

function addEntry(acc: { records: number; pages: number; uploaded: number; errors: number }, e: { numRecords: number; numPages: number; numUploaded: number; numErrors: number }) {
  acc.records += e.numRecords;
  acc.pages += e.numPages;
  acc.uploaded += e.numUploaded;
  acc.errors += e.numErrors;
}

function UserSummaryTable({
  rows,
  totals,
  totalLabel,
}: {
  rows: { id: string; name: string; records: number; pages: number; uploaded: number; errors: number; hours: number }[];
  totals: { records: number; pages: number; uploaded: number; errors: number; hours: number };
  totalLabel: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Người thực hiện</th>
            <th className="text-center">Số HS</th>
            <th className="text-center">Số trang đã scan</th>
            <th className="text-center">Upload</th>
            <th className="text-center">Lỗi</th>
            <th className="text-center">Số giờ làm trong ngày</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-slate-400 italic py-4">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const c = userColor(r.id);
              return (
                <tr key={r.id} className="entry-row">
                  <td style={{ borderLeftColor: c.border }}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.border }} />
                      <span style={{ color: c.text }} className="font-medium">{r.name}</span>
                    </span>
                  </td>
                  <td className="text-center">{formatNumber(r.records)}</td>
                  <td className="text-center">{formatNumber(r.pages)}</td>
                  <td className="text-center">{formatNumber(r.uploaded)}</td>
                  <td className="text-center">{formatNumber(r.errors)}</td>
                  <td className="text-center">{formatNumber(r.hours, 1)}</td>
                </tr>
              );
            })
          )}
          <tr className="row-week-total">
            <td>▲ {totalLabel}</td>
            <td className="text-center">{formatNumber(totals.records)}</td>
            <td className="text-center">{formatNumber(totals.pages)}</td>
            <td className="text-center">{formatNumber(totals.uploaded)}</td>
            <td className="text-center">{formatNumber(totals.errors)}</td>
            <td className="text-center">{formatNumber(totals.hours, 1)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function DocTypeSummaryTable({
  rows,
  totals,
  totalLabel,
}: {
  rows: { id: string; name: string; records: number; pages: number; uploaded: number; errors: number }[];
  totals: { records: number; pages: number; uploaded: number; errors: number };
  totalLabel: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Loại hồ sơ</th>
            <th className="text-center">Số HS</th>
            <th className="text-center">Số trang đã scan</th>
            <th className="text-center">Upload</th>
            <th className="text-center">Lỗi</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-slate-400 italic py-4">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td className="text-center">{formatNumber(r.records)}</td>
                <td className="text-center">{formatNumber(r.pages)}</td>
                <td className="text-center">{formatNumber(r.uploaded)}</td>
                <td className="text-center">{formatNumber(r.errors)}</td>
              </tr>
            ))
          )}
          <tr className="row-week-total">
            <td>▲ {totalLabel}</td>
            <td className="text-center">{formatNumber(totals.records)}</td>
            <td className="text-center">{formatNumber(totals.pages)}</td>
            <td className="text-center">{formatNumber(totals.uploaded)}</td>
            <td className="text-center">{formatNumber(totals.errors)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
