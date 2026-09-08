import Link from "next/link";

import type { PatientDashboard } from "@/types/patient";

interface PatientCardProps {
  patient: PatientDashboard;
}

export default function PatientCard({
  patient,
}: PatientCardProps) {
  return (
    <Link
      href={`/dashboard/patients/${patient.patient_id}`}
      className="block"
    >
      <div className="card bg-base-100 border border-base-300 transition hover:shadow-md">
        <div className="card-body">

          {/* Patient Information */}
          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-lg font-bold">
                {patient.first_name} {patient.last_name}
              </h2>

              <p className="text-sm opacity-60">
                {patient.ward_name}
                {" • "}
                ห้อง {patient.room_number ?? "-"}
                {" • "}
                เตียง {patient.bed_number ?? "-"}
              </p>
            </div>

            <span
              className={`
                badge
                ${
                  patient.status === "critical"
                    ? "badge-error"
                    : patient.status === "warning"
                      ? "badge-warning"
                      : "badge-success"
                }
              `}
            >
              {patient.status}
            </span>

          </div>

          <div className="divider my-1" />

          {/* Sensor Information */}
          <div className="grid grid-cols-3 gap-3">

            <div>
              <p className="text-xs opacity-60">
                SpO₂
              </p>

              <p className="text-lg font-semibold">
                {patient.spo2 !== null
                  ? `${patient.spo2}%`
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs opacity-60">
                Heart Rate
              </p>

              <p className="text-lg font-semibold">
                {patient.heart_rate !== null
                  ? `${patient.heart_rate} bpm`
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs opacity-60">
                Saline
              </p>

              <p className="text-lg font-semibold">
                {patient.saline_percentage !== null
                  ? `${patient.saline_percentage}%`
                  : "-"}
              </p>
            </div>

          </div>

          {/* Alerts */}
          {patient.active_alert_count > 0 && (
            <div className="mt-2">
              <span className="text-sm text-error">
                {patient.active_alert_count} Active Alert
                {patient.active_alert_count > 1 ? "s" : ""}
              </span>
            </div>
          )}

        </div>
      </div>
    </Link>
  );
}