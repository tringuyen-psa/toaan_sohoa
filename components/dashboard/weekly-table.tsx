import { EntryWithRel } from "@/lib/queries";
import { formatNumber, vietnameseWeekdayLabel, formatDateVN, formatDateShort } from "@/lib/utils";
import { userColor } from "@/lib/colors";
import { StatusBadge } from "@/components/status-badge";

type Workday = { userId: string; workDate: Date; hours: number };

type Props = {
  days: Date[];
  entries: EntryWithRel[];
  workdays: Workday[];
  totalLabel: string;
};

const COL_COUNT = 9;

export function WeeklyTable({ days, entries, workdays, totalLabel }: Props) {
  const byDay = new Map<string, EntryWithRel[]>();
  const hoursByDay = new Map<string, number>();
  const hoursByUserDay = new Map<string, number>();
  for (const d of days) {
    byDay.set(d.toDateString(), []);
    hoursByDay.set(d.toDateString(), 0);
  }
  for (const e of entries) {
    const key = new Date(e.workDate).toDateString();
    if (byDay.has(key)) byDay.get(key)!.push(e);
  }
  for (const w of workdays) {
    const dayKey = new Date(w.workDate).toDateString();
    if (hoursByDay.has(dayKey)) {
      hoursByDay.set(dayKey, hoursByDay.get(dayKey)! + w.hours);
    }
    hoursByUserDay.set(`${w.userId}|${dayKey}`, w.hours);
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
            <th className="text-center">Số HS</th>
            <th className="text-center">Số trang đã scan</th>
            <th className="text-center">Upload</th>
            <th className="text-center">Lỗi</th>
            <th className="text-center">Số giờ làm trong ngày</th>
            <th>Trạng thái</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => {
            const rows = byDay.get(d.toDateString()) ?? [];
            const tot = sumTotals(rows);
            const dayHours = hoursByDay.get(d.toDateString()) ?? 0;
            return (
              <DayBlock
                key={d.toISOString()}
                day={d}
                rows={rows}
                tot={tot}
                dayHours={dayHours}
                hoursByUserDay={hoursByUserDay}
              />
            );
          })}
          <tr className="row-week-total">
            <td colSpan={2} className="text-center">▲ {totalLabel}</td>
            <td className="text-center">{formatNumber(weekTot.records)}</td>
            <td className="text-center">{formatNumber(weekTot.pages)}</td>
            <td className="text-center">{formatNumber(weekTot.uploaded)}</td>
            <td className="text-center">{formatNumber(weekTot.errors)}</td>
            <td className="text-center">{formatNumber(weekHours, 1)}</td>
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
  hoursByUserDay,
}: {
  day: Date;
  rows: EntryWithRel[];
  tot: ReturnType<typeof sumTotals>;
  dayHours: number;
  hoursByUserDay: Map<string, number>;
}) {
  const dayKey = day.toDateString();
  return (
    <>
      <tr className="day-header">
        <td colSpan={COL_COUNT}>
          ▼ {vietnameseWeekdayLabel(day)} — {formatDateVN(day)}
        </td>
      </tr>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={COL_COUNT} className="text-center text-slate-400 italic py-3">
            (Chưa có dữ liệu)
          </td>
        </tr>
      ) : (
        groupByUser(rows).flatMap((group) => {
          const userHours = hoursByUserDay.get(`${group.userId}|${dayKey}`);
          return group.rows.map((r, idx) => {
            const c = userColor(r.user.id);
            return (
              <tr key={r.id} className="entry-row">
                {idx === 0 && (
                  <td
                    rowSpan={group.rows.length}
                    style={{ borderLeftColor: c.border, verticalAlign: "middle" }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: c.border }}
                      />
                      <span style={{ color: c.text }} className="font-medium">{r.user.name}</span>
                    </span>
                  </td>
                )}
                <td>{r.docType.name}</td>
                <td className="text-center">{formatNumber(r.numRecords)}</td>
                <td className="text-center">{formatNumber(r.numPages)}</td>
                <td className="text-center">{formatNumber(r.numUploaded)}</td>
                <td className="text-center">{formatNumber(r.numErrors)}</td>
                {idx === 0 && (
                  <td
                    rowSpan={group.rows.length}
                    className="text-center font-semibold bg-slate-50"
                    style={{ verticalAlign: "middle" }}
                  >
                    {userHours !== undefined ? (
                      formatNumber(userHours, 1)
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>
                )}
                <td><StatusBadge status={r.status} /></td>
                <td>{r.note ?? ""}</td>
              </tr>
            );
          });
        })
      )}
      <tr className="row-total">
        <td colSpan={2}>Tổng ngày {formatDateShort(day)}</td>
        <td className="text-center">{formatNumber(tot.records)}</td>
        <td className="text-center">{formatNumber(tot.pages)}</td>
        <td className="text-center">{formatNumber(tot.uploaded)}</td>
        <td className="text-center">{formatNumber(tot.errors)}</td>
        <td className="text-center">{formatNumber(dayHours, 1)}</td>
        <td colSpan={2}></td>
      </tr>
    </>
  );
}

function groupByUser(rows: EntryWithRel[]): { userId: string; rows: EntryWithRel[] }[] {
  const map = new Map<string, EntryWithRel[]>();
  for (const r of rows) {
    if (!map.has(r.user.id)) map.set(r.user.id, []);
    map.get(r.user.id)!.push(r);
  }
  return Array.from(map.entries()).map(([userId, rows]) => ({ userId, rows }));
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
