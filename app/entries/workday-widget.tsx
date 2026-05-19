"use client";

import { useState, useTransition } from "react";
import { upsertWorkday } from "./workday-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Gauge, FileText, Save, Loader2, UserRound, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { cn, formatNumber, pagesPerHour } from "@/lib/utils";
import { userColor } from "@/lib/colors";

type UserOpt = { id: string; name: string };

type Props = {
  users: UserOpt[];
  currentUserId?: string;
  currentDate: string;
  currentHours: number;
  pagesToday: number;
};

export function WorkdayWidget({ users, currentUserId, currentDate, currentHours, pagesToday }: Props) {
  const [hours, setHours] = useState(currentHours);
  const [date, setDate] = useState(currentDate);
  const [userId, setUserId] = useState(currentUserId ?? "");
  const [pending, start] = useTransition();

  const selectedUser = users.find((u) => u.id === userId);
  const userClr = selectedUser ? userColor(selectedUser.id) : null;
  const productivity = pagesPerHour(pagesToday, hours);

  function save() {
    if (!userId) {
      toast.error("Chọn người thực hiện");
      return;
    }
    start(async () => {
      const r = await upsertWorkday({ userId, workDate: date, hours });
      if (r.ok) toast.success("Đã lưu giờ làm");
      else toast.error(r.message ?? "Lỗi");
    });
  }

  return (
    <Card className="overflow-hidden border-2 border-indigo-100">
      <div className="bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-transparent px-5 py-2 border-b">
        <h3 className="text-sm font-semibold text-indigo-900 inline-flex items-center gap-2">
          <Clock className="h-4 w-4" /> Giờ làm trong ngày
        </h3>
      </div>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-3 space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5 text-slate-400" /> Người
            </Label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={userClr ? { borderLeftWidth: 4, borderLeftColor: userClr.border } : undefined}
            >
              <option value="">— chọn —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" /> Ngày
            </Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>

          <div className="lg:col-span-2">
            <div className={cn("rounded-lg border bg-white p-2.5 transition-all focus-within:ring-2 focus-within:ring-amber-200/50 focus-within:border-amber-400")}>
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Số giờ làm
              </Label>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full bg-transparent text-2xl font-bold tabular-nums text-amber-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-white border p-3 h-full flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Gauge className="h-5 w-5 text-indigo-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Năng suất</div>
                <div className="text-2xl font-bold text-indigo-900 tabular-nums truncate">
                  {formatNumber(productivity)}
                  <span className="text-xs font-medium text-slate-500 ml-1">trang/giờ</span>
                </div>
                <div className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {formatNumber(pagesToday)} trang ÷ {formatNumber(hours, 1)} giờ
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Button onClick={save} disabled={pending} className="w-full h-10">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
