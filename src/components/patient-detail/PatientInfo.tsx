import type { PatientDetail } from "@/types/patient-detail";

interface Props {
  patient: PatientDetail;
}

export default function PatientInfo({
  patient,
}: Props) {
  return (
    <div className="card bg-base-100 shadow-sm border">
      <div className="card-body">

        <h2 className="card-title">
          Patient Information
        </h2>

        <div className="grid grid-cols-2 gap-4 mt-4">

          <div>
            <div className="text-sm opacity-60">
              Name
            </div>

            <div className="font-semibold">
              {patient.first_name}{" "}
              {patient.last_name}
            </div>
          </div>

          <div>
            <div className="text-sm opacity-60">
              Ward
            </div>

            <div className="font-semibold">
              {patient.ward_name}
            </div>
          </div>

          <div>
            <div className="text-sm opacity-60">
              Room
            </div>

            <div className="font-semibold">
              {patient.room_number ?? "-"}
            </div>
          </div>

          <div>
            <div className="text-sm opacity-60">
              Bed
            </div>

            <div className="font-semibold">
              {patient.bed_number ?? "-"}
            </div>
          </div>

          <div>
            <div className="text-sm opacity-60">
              Status
            </div>

            <div className="font-semibold">
              {patient.status.toUpperCase()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}