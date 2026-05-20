"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet } from "lucide-react";

type Opt = { id: string; name: string };

type Mode = "all" | "details" | "by-user" | "by-doctype" | "by-day";
type Period = "day" | "week" | "month" | "year" | "all";

const MODES: { value: Mode; label: string; desc: string }[] = [
  { value: "all", label: "Tất cả (mỗi loại 1 sheet)", desc: "Chi tiết + theo người + theo loại HS + theo ngày + workdays" },
  { value: "details", label: "Chi tiết bản ghi", desc: "Tất cả entry theo từng dòng" },
  { value: "by-user", label: "Theo người", desc: "Gộp số liệu theo từng người" },
  { value: "by-doctype", label: "Theo loại hồ sơ", desc: "Gộp số liệu theo từng loại hồ sơ" },
  { value: "by-day", label: "Theo ngày", desc: "Gộp số liệu theo từng ngày" },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Ngày" },
  { value: "week", label: "Tuần" },
  { value: "month", label: "Tháng" },
  { value: "year", label: "Năm" },
  { value: "all", label: "Toàn bộ" },
];

export function ExportForm({ users, docTypes }: { users: Opt[]; docTypes: Opt[] }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [mode, setMode] = useState<Mode>("all");
  const [period, setPeriod] = useState<Period>("month");
  const [date, setDate] = useState(today);
  const [userId, setUserId] = useState("");
  const [docTypeId, setDocTypeId] = useState("");

  const dateInputType =
    period === "day" ? "date"
    : period === "month" ? "month"
    : period === "year" ? "number"
    : period === "week" ? "date"
    : null;

  const dateValue =
    period === "month" ? date.slice(0, 7)
    : period === "year" ? date.slice(0, 4)
    : date;

  function onDateChange(v: string) {
    if (period === "month") setDate(v + "-01");
    else if (period === "year") setDate(v + "-01-01");
    else setDate(v);
  }

  function buildUrl() {
    const params = new URLSearchParams({ mode, period });
    if (period !== "all") params.set("date", date);
    if (userId) params.set("userId", userId);
    if (docTypeId) params.set("docTypeId", docTypeId);
    return `/api/export?${params.toString()}`;
  }

  return (
    <div className="space-y-5">
      <section>
        <Label className="text-sm font-bold text-slate-900 mb-2 block">Khoảng thời gian</Label>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="inline-flex rounded-md border bg-white shadow-sm overflow-hidden text-sm">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={
                  "px-3 py-1.5 transition-colors " +
                  (period === p.value
                    ? "bg-[#1e3a8a] text-white font-semibold"
                    : "hover:bg-slate-100")
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          {dateInputType && (
            <input
              type={dateInputType}
              value={dateValue}
              min={period === "year" ? 2020 : undefined}
              max={period === "year" ? 2099 : undefined}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium"
            />
          )}
          {period === "week" && (
            <span className="text-xs text-slate-500">
              Chọn ngày bất kỳ trong tuần — hệ thống tự lấy cả tuần ISO.
            </span>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-900">Lọc theo người (tuỳ chọn)</Label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">— tất cả người —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-900">Lọc theo loại hồ sơ (tuỳ chọn)</Label>
          <select
            value={docTypeId}
            onChange={(e) => setDocTypeId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">— tất cả loại —</option>
            {docTypes.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <Label className="text-sm font-bold text-slate-900 mb-2 block">Chế độ xuất</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {MODES.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={
                  "text-left rounded-lg border-2 p-3 transition-all " +
                  (active
                    ? "border-[#1e3a8a] bg-blue-50 ring-2 ring-[#1e3a8a]/20"
                    : "border-slate-200 hover:border-slate-300 bg-white")
                }
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <FileSpreadsheet className={"h-4 w-4 " + (active ? "text-[#1e3a8a]" : "text-slate-400")} />
                  {m.label}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end pt-2 border-t">
        <a href={buildUrl()} target="_blank" rel="noreferrer">
          <Button size="lg" className="min-w-[180px]">
            <Download className="h-4 w-4" /> Tải file Excel
          </Button>
        </a>
      </div>
    </div>
  );
}
