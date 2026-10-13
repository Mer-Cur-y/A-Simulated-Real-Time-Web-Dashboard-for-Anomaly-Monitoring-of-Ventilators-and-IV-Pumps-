
"use client";

import type { PatientDashboard } from "@/types/patient";
import PatientCard from "./PatientCard";

interface PatientListProps {
  patients: PatientDashboard[];
  loading?: boolean;
  error?: string | null;
  onPatientClick?: (patient: PatientDashboard) => void;
}

export default function PatientList({
  patients,
  loading = false,
  error = null,
  onPatientClick,
}: PatientListProps) {
  const gridClass =
    "grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-48 min-w-0 animate-pulse rounded-2xl border border-base-300 bg-base-100"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-w-0 rounded-2xl border border-error/30 bg-error/5 p-6 text-center">
        <p className="font-medium text-error">
          ไม่สามารถโหลดข้อมูลผู้ป่วยได้
        </p>
        <p className="mt-1 break-words text-sm text-base-content/60">
          {error}
        </p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="w-full min-w-0 rounded-2xl border border-base-300 bg-base-100 p-10 text-center">
        <p className="font-medium">ไม่พบข้อมูลผู้ป่วย</p>
        <p className="mt-1 text-sm text-base-content/60">
          ลองเปลี่ยนคำค้นหา สถานะ หรือ Ward
        </p>
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {patients.map((patient) => (
        <div
          key={patient.uwid}
          className="h-full min-w-0 [&>*]:h-full [&>*]:w-full [&>*]:min-w-0"
        >
          <PatientCard
            patient={patient}
            onClick={onPatientClick}
          />
        </div>
      ))}
    </div>
  );
}
