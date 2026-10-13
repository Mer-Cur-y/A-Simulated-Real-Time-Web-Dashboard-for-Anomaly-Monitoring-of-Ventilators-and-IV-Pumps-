"use client";

import type { PatientDashboard } from "@/types/patient";

interface PatientCardProps {
  patient: PatientDashboard;
  onClick?: (patient: PatientDashboard) => void;
}

const monitorStatusLabel = {
  normal: "ปกติ",
  warning: "เฝ้าระวัง",
  critical: "วิกฤต",
};

const salineStatusLabel = {
  normal: "ปกติ",
  low: "ใกล้หมด",
  empty: "หมดแล้ว",
};

export default function PatientCard({ patient, onClick }: PatientCardProps) {
  const monitorStatus = patient.monitor_status;
  const salineStatus = patient.saline_status;

  const monitorStyle =
    monitorStatus === "critical"
      ? "bg-error/10 text-error"
      : monitorStatus === "warning"
        ? "bg-warning/10 text-warning"
        : "bg-success/10 text-success";

  const salineStyle =
    salineStatus === "empty"
      ? "bg-error/10 text-error"
      : salineStatus === "low"
        ? "bg-warning/10 text-warning"
        : "bg-success/10 text-success";
  const cardSeverity =
    patient.monitor_status === "critical" || patient.saline_status === "empty"
      ? "critical"
      : patient.monitor_status === "warning" || patient.saline_status === "low"
        ? "warning"
        : "normal";

  const cardStyle =
    cardSeverity === "critical"
      ? "border-error/60 bg-error/5 hover:bg-error/10 hover:border-error"
      : cardSeverity === "warning"
        ? "border-warning/60 bg-warning/5 hover:bg-warning/10 hover:border-warning"
        : "border-base-300 bg-base-100 hover:border-primary/40";

  return (
    <button
      type="button"
      onClick={() => onClick?.(patient)}
      className={`group flex h-full min-w-0 w-full flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-colors duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${cardStyle}`}
    >
      {/* Patient information */}
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <span className="text-lg font-semibold" aria-hidden="true">
            {patient.first_name?.charAt(0) || "?"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h2
            title={`${patient.first_name} ${patient.last_name}`}
            className="break-words text-base font-semibold leading-6"
          >
            {patient.first_name} {patient.last_name}
          </h2>

          <p className="mt-1 break-all text-xs text-base-content/60">
            OPD: {patient.opd || "-"}
          </p>
        </div>
      </div>

      {/* Monitor status */}
      <div className="mt-4 flex min-w-0 items-center justify-between gap-2 border-b border-base-300 pb-3">
        <span className="text-sm text-base-content/60">สถานะผู้ป่วย</span>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${monitorStyle}`}
        >
          {monitorStatusLabel[monitorStatus]}
        </span>
      </div>

      {/* Ward / room / bed */}
      <div className="mt-3 grid min-w-0 grid-cols-3 gap-2">
        <div className="min-w-0">
          <p className="text-xs text-base-content/50">Ward</p>
          <p
            title={patient.ward_name || "-"}
            className="mt-1 truncate text-sm font-medium"
          >
            {patient.ward_name || "-"}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-base-content/50">ห้อง</p>
          <p className="mt-1 truncate text-sm font-medium">
            {patient.room_number ?? "-"}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-base-content/50">เตียง</p>
          <p className="mt-1 truncate text-sm font-medium">
            {patient.bed_number ?? "-"}
          </p>
        </div>
      </div>

      {/* Respiratory values */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-base-content/60">
          ข้อมูลการหายใจ
        </p>

        <div className="grid min-w-0 grid-cols-2 gap-2">
          <div className="min-w-0 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-700">SpO₂</p>
            <p className="mt-1 break-words text-xl font-bold tabular-nums text-blue-900">
              {patient.spo2 !== null ? `${patient.spo2}%` : "-"}
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-orange-100 bg-orange-50 p-3">
            <p className="text-xs font-medium text-orange-700">Heart Rate</p>
            <p className="mt-1 break-words text-xl font-bold tabular-nums text-orange-900">
              {patient.heart_rate !== null ? patient.heart_rate : "-"}
            </p>
            <p className="text-xs text-orange-700/80">bpm</p>
          </div>
        </div>
      </div>

      {/* Saline */}
      <div className="mt-3 min-w-0 rounded-xl border border-teal-100 bg-teal-50/60 p-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-base-content/60">ระดับสารน้ำ</p>
            <p className="mt-1 break-words text-lg font-bold tabular-nums">
              {patient.saline_value !== null ? `${patient.saline_value}%` : "-"}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${salineStyle}`}
          >
            {salineStatusLabel[salineStatus]}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-base-content/50">
        <span>ดูรายละเอียดผู้ป่วย</span>
        <span className="text-base transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </button>
  );
}
