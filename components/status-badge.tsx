import { CheckCircle2, Loader2, Eye } from "lucide-react";

type Status = "DONE" | "IN_PROGRESS" | "REVIEW";

const STATUS_CONFIG: Record<Status, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  DONE: {
    label: "Hoàn thành",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    label: "Đang làm",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Loader2,
  },
  REVIEW: {
    label: "Kiểm tra",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Eye,
  },
};

export function StatusBadge({ status }: { status: Status | string }) {
  const config = STATUS_CONFIG[status as Status];
  if (!config) return <span className="text-slate-500">{status}</span>;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${config.className}`}
    >
      <Icon className="h-3 w-3" /> {config.label}
    </span>
  );
}
