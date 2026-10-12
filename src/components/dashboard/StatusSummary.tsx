"use client";

interface StatusSummaryProps {
  total: number;
  normal: number;
  warning: number;
  critical: number;
  salineLow: number;
  salineEmpty: number;
}

interface SummaryCardProps {
  label: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "critical";
}

const tones = {
  neutral: {
    border: "border-slate-200",
    background: "bg-white",
    marker: "bg-slate-400",
    value: "text-slate-900",
  },
  success: {
    border: "border-emerald-200",
    background: "bg-emerald-50/70",
    marker: "bg-emerald-500",
    value: "text-emerald-800",
  },
  warning: {
    border: "border-amber-200",
    background: "bg-amber-50/80",
    marker: "bg-amber-500",
    value: "text-amber-800",
  },
  critical: {
    border: "border-red-200",
    background: "bg-red-50/80",
    marker: "bg-red-500",
    value: "text-red-800",
  },
};

export default function StatusSummary({
  total,
  normal,
  warning,
  critical,
  salineLow,
  salineEmpty,
}: StatusSummaryProps) {
  return (
    <section aria-label="สรุปสถานะผู้ป่วยและสารน้ำ" className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <SummaryCard label="ผู้ป่วยทั้งหมด" value={total} tone="neutral" />
      <SummaryCard label="ปกติ · Normal" value={normal} tone="success" />
      <SummaryCard label="เฝ้าระวัง · Warning" value={warning} tone="warning" />
      <SummaryCard label="วิกฤต · Critical" value={critical} tone="critical" />
      <SummaryCard label="สารน้ำใกล้หมด" value={salineLow} tone="warning" />
      <SummaryCard label="สารน้ำหมด" value={salineEmpty} tone="critical" />
    </section>
  );
}

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  const style = tones[tone];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${style.border} ${style.background} p-4 shadow-sm transition-shadow hover:shadow-md`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${style.marker}`} aria-hidden="true" />
      <p className="pl-1 text-xs font-semibold leading-5 text-slate-600">{label}</p>
      <p className={`mt-2 pl-1 text-3xl font-bold tracking-tight tabular-nums ${style.value}`}>
        {value.toLocaleString("th-TH")}
      </p>
    </div>
  );
}
