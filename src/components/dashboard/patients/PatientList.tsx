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
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-32 w-full animate-pulse rounded-xl bg-base-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/30 bg-error/5 p-6 text-center">
        <p className="font-medium text-error">
          ไม่สามารถโหลดข้อมูลผู้ป่วยได้
        </p>

        <p className="mt-1 text-sm text-base-content/60">
          {error}
        </p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-100 p-10 text-center">
        <p className="font-medium">
          ไม่พบข้อมูลผู้ป่วย
        </p>

        <p className="mt-1 text-sm text-base-content/60">
          ลองเปลี่ยน Ward หรือเงื่อนไขการกรอง
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {patients.map((patient) => (
        <PatientCard
          key={patient.uwid}
          patient={patient}
          onClick={onPatientClick}
        />
      ))}
    </div>
  );
}
