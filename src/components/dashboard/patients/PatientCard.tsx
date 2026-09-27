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

export default function PatientCard({
  patient,
  onClick,
}: PatientCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(patient)}
      className="w-full rounded-xl border border-base-300 bg-base-100 p-4 text-left shadow-sm transition hover:border-base-content/20 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Patient */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">
                {patient.first_name} {patient.last_name}
              </h2>

              <p className="mt-1 text-sm text-base-content/60">
                OPD: {patient.opd}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                patient.monitor_status === "critical"
                  ? "bg-error/10 text-error"
                  : patient.monitor_status === "warning"
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
              }`}
            >
              {monitorStatusLabel[patient.monitor_status]}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-base-content/60">
            <span>
              {patient.ward_name}
            </span>

            <span>
              ห้อง {patient.room_number ?? "-"}
            </span>

            <span>
              เตียง {patient.bed_number ?? "-"}
            </span>
          </div>
        </div>

        {/* Respiratory */}
        <div className="flex shrink-0 gap-3">
          <div className="min-w-28 rounded-lg bg-base-200 px-4 py-3">
            <p className="text-xs text-base-content/60">
              SpO₂
            </p>

            <p className="mt-1 text-lg font-semibold">
              {patient.spo2 !== null
                ? `${patient.spo2}%`
                : "-"}
            </p>
          </div>

          <div className="min-w-28 rounded-lg bg-base-200 px-4 py-3">
            <p className="text-xs text-base-content/60">
              Heart Rate
            </p>

            <p className="mt-1 text-lg font-semibold">
              {patient.heart_rate !== null
                ? `${patient.heart_rate} bpm`
                : "-"}
            </p>
          </div>
        </div>

        {/* Saline */}
        <div className="flex min-w-36 shrink-0 items-center justify-between gap-4 rounded-lg border border-base-300 px-4 py-3">
          <div>
            <p className="text-xs text-base-content/60">
              สารน้ำ
            </p>

            <p className="mt-1 text-lg font-semibold">
              {patient.saline_value !== null
                ? `${patient.saline_value}%`
                : "-"}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              patient.saline_status === "empty"
                ? "bg-error/10 text-error"
                : patient.saline_status === "low"
                  ? "bg-warning/10 text-warning"
                  : "bg-success/10 text-success"
            }`}
          >
            {salineStatusLabel[patient.saline_status]}
          </span>
        </div>

        {/* Arrow */}
        <div className="hidden text-xl text-base-content/40 lg:block">
          →
        </div>
      </div>
    </button>
  );
}