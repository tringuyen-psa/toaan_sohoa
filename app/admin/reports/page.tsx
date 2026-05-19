import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, pagesPerHour } from "@/lib/utils";
import { startOfMonth, endOfMonth, parseISO, isValid, format } from "date-fns";
import { PagesByUserChart, DocTypePieChart } from "@/components/dashboard/charts";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  await requireAdmin();

  const baseMonth =
    searchParams.month && isValid(parseISO(searchParams.month + "-01"))
      ? parseISO(searchParams.month + "-01")
      : new Date();
  const start = startOfMonth(baseMonth);
  const end = endOfMonth(baseMonth);
  end.setHours(23, 59, 59, 999);

  const entries = await prisma.productivityEntry.findMany({
    where: { workDate: { gte: start, lte: end } },
    include: {
      user: { select: { id: true, name: true } },
      docType: { select: { id: true, name: true } },
    },
  });

  const byUser = new Map<string, { name: string; records: number; pages: number; uploaded: number; errors: number; hours: number }>();
  const byDocType = new Map<string, number>();

  for (const e of entries) {
    const uk = e.user.id;
    if (!byUser.has(uk))
      byUser.set(uk, { name: e.user.name, records: 0, pages: 0, uploaded: 0, errors: 0, hours: 0 });
    const acc = byUser.get(uk)!;
    acc.records += e.numRecords;
    acc.pages += e.numPages;
    acc.uploaded += e.numUploaded;
    acc.errors += e.numErrors;
    acc.hours += e.hours;

    byDocType.set(e.docType.name, (byDocType.get(e.docType.name) ?? 0) + e.numPages);
  }

  const userRows = Array.from(byUser.values()).sort((a, b) => b.pages - a.pages);
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

  const monthVal = format(baseMonth, "yyyy-MM");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a]">Báo cáo tổng hợp</h1>
          <p className="text-sm text-slate-600">Tổng hợp năng suất theo tháng — chia theo người và loại hồ sơ</p>
        </div>
        <form className="flex items-center gap-2">
          <label className="text-sm">Tháng:</label>
          <input
            type="month"
            name="month"
            defaultValue={monthVal}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          <button className="h-9 rounded-md bg-primary px-4 text-sm text-white">Xem</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PagesByUserChart data={userRows.map((r) => ({ name: r.name, pages: r.pages }))} />
        <DocTypePieChart
          data={Array.from(byDocType.entries()).map(([name, value]) => ({ name, value }))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bảng tổng hợp theo người ({format(baseMonth, "MM/yyyy")})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Người thực hiện</th>
                  <th className="text-right">Số HS</th>
                  <th className="text-right">Số trang</th>
                  <th className="text-right">Upload</th>
                  <th className="text-right">Lỗi</th>
                  <th className="text-right">Giờ</th>
                  <th className="text-right">Trang/giờ</th>
                </tr>
              </thead>
              <tbody>
                {userRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 italic py-4">
                      Không có dữ liệu trong tháng
                    </td>
                  </tr>
                ) : (
                  userRows.map((r) => (
                    <tr key={r.name}>
                      <td className="font-medium">{r.name}</td>
                      <td className="text-right">{formatNumber(r.records)}</td>
                      <td className="text-right">{formatNumber(r.pages)}</td>
                      <td className="text-right">{formatNumber(r.uploaded)}</td>
                      <td className="text-right">{formatNumber(r.errors)}</td>
                      <td className="text-right">{formatNumber(r.hours, 1)}</td>
                      <td className="text-right">{formatNumber(pagesPerHour(r.pages, r.hours))}</td>
                    </tr>
                  ))
                )}
                <tr className="row-week-total">
                  <td>TỔNG THÁNG</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
