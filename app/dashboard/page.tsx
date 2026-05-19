import { resolvePeriod } from "@/lib/period";
import { getEntriesInRange } from "@/lib/queries";
import { PeriodPicker } from "@/components/dashboard/period-picker";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { WeeklyTable } from "@/components/dashboard/weekly-table";
import {
  PagesByUserChart,
  PagesByDayChart,
  DocTypePieChart,
} from "@/components/dashboard/charts";
import { formatDateShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { period?: string; date?: string };
}) {
  const range = resolvePeriod(searchParams.period, searchParams.date, "week");
  const entries = await getEntriesInRange(range.start, range.end);

  const totals = entries.reduce(
    (a, e) => {
      a.records += e.numRecords;
      a.pages += e.numPages;
      a.uploaded += e.numUploaded;
      a.errors += e.numErrors;
      a.hours += e.hours;
      return a;
    },
    { records: 0, pages: 0, uploaded: 0, errors: 0, hours: 0 }
  );

  const pagesByUser = new Map<string, { name: string; pages: number }>();
  for (const e of entries) {
    const cur = pagesByUser.get(e.user.id);
    pagesByUser.set(e.user.id, {
      name: e.user.name,
      pages: (cur?.pages ?? 0) + e.numPages,
    });
  }
  const pagesByUserData = Array.from(pagesByUser.entries())
    .map(([key, v]) => ({ key, name: v.name, pages: v.pages }))
    .sort((a, b) => b.pages - a.pages);

  const pagesByDayData = range.days.map((d) => {
    const dayEntries = entries.filter(
      (e) => new Date(e.workDate).toDateString() === d.toDateString()
    );
    return {
      day: formatDateShort(d),
      pages: dayEntries.reduce((s, e) => s + e.numPages, 0),
      records: dayEntries.reduce((s, e) => s + e.numRecords, 0),
    };
  });

  const docTypeMap = new Map<string, number>();
  for (const e of entries) {
    docTypeMap.set(e.docType.name, (docTypeMap.get(e.docType.name) ?? 0) + e.numPages);
  }
  const docTypeData = Array.from(docTypeMap.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a]">
            Dashboard năng suất số hóa
          </h1>
          <p className="text-sm text-slate-600">
            {range.label} • Theo dõi sản lượng số hồ sơ, số trang và năng suất
          </p>
        </div>
        <PeriodPicker range={range} />
      </div>

      <KpiCards totals={totals} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PagesByUserChart data={pagesByUserData} />
        <PagesByDayChart data={pagesByDayData} />
        <DocTypePieChart data={docTypeData} />
      </div>

      <WeeklyTable days={range.days} entries={entries} totalLabel={range.totalLabel} />
    </div>
  );
}
