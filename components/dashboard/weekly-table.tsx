import { EntryWithRel } from "@/lib/queries";
import { formatNumber, pagesPerHour, vietnameseWeekdayLabel, formatDateVN, formatDateShort } from "@/lib/utils";
import { userColor } from "@/lib/colors";

type Workday = { userId: string; workDate: Date; hours: number };

type Props = {
  days: Date[];
  entries: EntryWithRel[];
  workdays: Workday[];
  totalLabel: string;
};

function statusLabel(s: string) {
  if (s === "DONE") return "Hoàn thành";
  if (s === "IN_PROGRESS") return "Đang làm";
  if (s === "REVIEW") return "Kiểm tra";
  return s;
}

export function WeeklyTable({ days, entries, workdays, totalLabel }: Props) {
  const byDay = new Map<string, EntryWithRel[]>();
  const hoursByDay = new Map<string, number>();
  for (const d of days) {
    byDay.set(d.toDateString(), []);
    hoursByDay.set(d.toDateString(), 0);
  }
  for (const e of entries) {
    const key = new Date(e.workDate).toDateString();
    if (byDay.has(key)) byDay.get(key)!.push(e);
  }
  for (const w of workdays) {
    const key = new Date(w.workDate).toDateString();
    if (hoursByDay.has(key)) {
      hoursByDay.set(key, hoursByDay.get(key)! + w.hours);
    }
  }

  const weekTot = sumTotals(entries);
  const weekHours = workdays.reduce((s, w) => s + w.hours, 0);

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Người thực hiện</th>
            <th>Loại hồ sơ</th>
            <th className="text-right">Số HS</th>
            <th className="text-right">Số trang</th>
            <th className="text-right">Upload</th>
            <th className="text-right">Lỗi</th>
            <th className="text-right">Giờ</th>
            <th className="text-right">Trang/giờ</th>
            <th>Trạng thái</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => {
            const rows = byDay.get(d.toDateString()) ?? [];
            const tot = sumTotals(rows);
            const dayHours = hoursByDay.get(d.toDateString()) ?? 0;
            return <DayBlock key={d.toISOString()} day={d} rows={rows} tot={tot} dayHours={dayHours} />;
          })}
          <tr className="row-week-total">
            <td colSpan={2} className="text-center">▲ {totalLabel}</td>
            <td className="text-right">{formatNumber(weekTot.records)}</td>
            <td className="text-right">{formatNumber(weekTot.pages)}</td>
            <td className="text-right">{formatNumber(weekTot.uploaded)}</td>
            <td className="text-right">{formatNumber(weekTot.errors)}</td>
            <td className="text-right">{formatNumber(weekHours, 1)}</td>
            <td className="text-right">{formatNumber(pagesPerHour(weekTot.pages, weekHours))}</td>
            <td colSpan={2}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function DayBlock({
  day,
  rows,
  tot,
  dayHours,
}: {
  day: Date;
  rows: EntryWithRel[];
  tot: ReturnType<typeof sumTotals>;
  dayHours: number;
}) {
  return (
    <>
      <tr className="day-header">
        <td colSpan={10}>
          ▼ {vietnameseWeekdayLabel(day)} — {formatDateVN(day)}
        </td>
      </tr>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={10} className="text-center text-slate-400 italic py-3">
            (Chưa có dữ liệu)
          </td>
        </tr>
      ) : (
        rows.map((r) => {
          const c = userColor(r.user.id);
          return (
          <tr key={r.id} className="entry-row">
            <td style={{ borderLeftColor: c.border }}>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: c.border }}
                />
                <span style={{ color: c.text }} className="font-medium">{r.user.name}</span>
              </span>
            </td>
            <td>{r.docType.name}</td>
            <td className="text-right">{formatNumber(r.numRecords)}</td>
            <td className="text-right">{formatNumber(r.numPages)}</td>
            <td className="text-right">{formatNumber(r.numUploaded)}</td>
            <td className="text-right">{formatNumber(r.numErrors)}</td>
            <td className="text-right text-slate-400">—</td>
            <td className="text-right text-slate-400">—</td>
            <td>{statusLabel(r.status)}</td>
            <td>{r.note ?? ""}</td>
          </tr>
          );
        })
      )}
      <tr className="row-total">
        <td colSpan={2}>Tổng ngày {formatDateShort(day)}</td>
        <td className="text-right">{formatNumber(tot.records)}</td>
        <td className="text-right">{formatNumber(tot.pages)}</td>
        <td className="text-right">{formatNumber(tot.uploaded)}</td>
        <td className="text-right">{formatNumber(tot.errors)}</td>
        <td className="text-right">{formatNumber(dayHours, 1)}</td>
        <td className="text-right">{formatNumber(pagesPerHour(tot.pages, dayHours))}</td>
        <td colSpan={2}></td>
      </tr>
    </>
  );
}

function sumTotals(rows: EntryWithRel[]) {
  return rows.reduce(
    (acc, r) => {
      acc.records += r.numRecords;
      acc.pages += r.numPages;
      acc.uploaded += r.numUploaded;
      acc.errors += r.numErrors;
      return acc;
    },
    { records: 0, pages: 0, uploaded: 0, errors: 0 }
  );
}
