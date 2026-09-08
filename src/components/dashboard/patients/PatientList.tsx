import PatientCard from "./PatientCard";

import type { PatientDashboard } from "@/types/patient";

interface PatientListProps {
  patients: PatientDashboard[];
  loading: boolean;
  error: string;
}

export default function PatientList({
  patients,
  loading,
  error,
}: PatientListProps) {

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="alert">
        <span>
          ไม่พบข้อมูลผู้ป่วย
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {patients.map((patient) => (
        <PatientCard
          key={patient.patient_id}
          patient={patient}
        />
      ))}
    </div>
  );
}
