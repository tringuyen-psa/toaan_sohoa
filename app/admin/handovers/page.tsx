import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getActiveDocTypes } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HandoverForm } from "./handover-form";
import { HandoverRow } from "./handover-row";
import { resolvePeriod } from "@/lib/period";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { ShowAllToggle } from "./show-all-toggle";

export const dynamic = "force-dynamic";

export default async function HandoversPage({
  searchParams,
}: {
  searchParams: { period?: string; date?: string; all?: string };
}) {
  await requireAdmin();
  const showAll = searchParams.all === "1";
  const range = resolvePeriod(searchParams.period, searchParams.date, "month");

  const [docTypes, rows] = await Promise.all([
    getActiveDocTypes(),
    prisma.handover.findMany({
      where: showAll ? {} : { recordDate: { gte: range.start, lte: range.end } },
      include: {
        items: { include: { docType: { select: { id: true, name: true } } } },
      },
      orderBy: [{ recordDate: "desc" }, { createdAt: "desc" }],
      take: 500,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a8a]">Bàn giao hồ sơ</h1>
        <p className="text-sm text-slate-600">
          Theo dõi việc nhận hồ sơ từ HCTP và bàn giao cho bộ phận số hoá.
        </p>
      </div>

      <Card className="border-2 border-[#1e3a8a]/20 shadow-md ring-1 ring-[#1e3a8a]/5">
        <CardHeader className="bg-gradient-to-r from-[#1e3a8a]/10 via-blue-500/5 to-transparent border-b">
          <CardTitle className="text-lg font-bold text-[#1e3a8a] uppercase tracking-wide">
            Thêm bàn giao mới
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <HandoverForm docTypes={docTypes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
          <CardTitle>
            {showAll
              ? `Tất cả bàn giao (${rows.length})`
              : `Bàn giao theo hồ sơ ngày · ${range.label} (${rows.length})`}
          </CardTitle>
          <div className="flex flex-col items-end gap-2">
            <ShowAllToggle showAll={showAll} />
            {!showAll && <PeriodPicker range={range} />}
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Không có bản ghi nào trong khoảng này.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Số lượng theo loại</th>
                    <th className="text-center">Hồ sơ ngày</th>
                    <th className="text-center">Nhận từ HCTP</th>
                    <th className="text-center">Bàn giao số hoá</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <HandoverRow key={row.id} row={row} docTypes={docTypes} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
