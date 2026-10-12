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
  valueClassName?: string;
}

export default function StatusSummary({
  total,
  normal,
  warning,
  critical,
  salineLow,
  salineEmpty,
}: StatusSummaryProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <SummaryCard
        label="ผู้ป่วยทั้งหมด"
        value={total}
      />

      <SummaryCard
        label="ปกติ"
        value={normal}
        valueClassName="text-success"
      />

      <SummaryCard
        label="เฝ้าระวัง"
        value={warning}
        valueClassName="text-warning"
      />

      <SummaryCard
        label="วิกฤต"
        value={critical}
        valueClassName="text-error"
      />

      <SummaryCard
        label="สารน้ำใกล้หมด"
        value={salineLow}
        valueClassName="text-warning"
      />

      <SummaryCard
        label="สารน้ำหมด"
        value={salineEmpty}
        valueClassName="text-error"
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClassName = "",
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <p className="text-xs text-base-content/60">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}