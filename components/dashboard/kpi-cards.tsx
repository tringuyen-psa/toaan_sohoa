import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, pagesPerHour } from "@/lib/utils";
import { FileText, Files, Clock, Gauge, Upload, AlertTriangle } from "lucide-react";

type Props = {
  totals: {
    records: number;
    pages: number;
    uploaded: number;
    errors: number;
    hours: number;
  };
};

export function KpiCards({ totals }: Props) {
  const avg = pagesPerHour(totals.pages, totals.hours);
  const items = [
    { label: "Tổng số HS", value: formatNumber(totals.records), icon: Files, tint: "text-blue-600" },
    { label: "Tổng số trang", value: formatNumber(totals.pages), icon: FileText, tint: "text-emerald-600" },
    { label: "Đã upload", value: formatNumber(totals.uploaded), icon: Upload, tint: "text-violet-600" },
    { label: "Lỗi", value: formatNumber(totals.errors), icon: AlertTriangle, tint: "text-rose-600" },
    { label: "Tổng giờ", value: formatNumber(totals.hours, 1), icon: Clock, tint: "text-amber-600" },
    { label: "Năng suất (trang/giờ)", value: formatNumber(avg), icon: Gauge, tint: "text-indigo-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => (
        <Card key={it.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600">{it.label}</span>
              <it.icon className={`h-4 w-4 ${it.tint}`} />
            </div>
            <div className="text-2xl font-bold text-[#1e3a8a]">{it.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
