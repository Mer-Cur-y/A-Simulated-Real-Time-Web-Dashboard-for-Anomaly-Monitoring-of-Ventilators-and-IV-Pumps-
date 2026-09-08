import type { SalineData } from "@/types/patient-detail";

interface Props {
  data: SalineData | null;
}

export default function SalineInfo({
  data,
}: Props) {
  return (
    <div className="card bg-base-100 shadow-sm border">
      <div className="card-body">

        <h2 className="card-title">
          Saline
        </h2>

        {!data ? (
          <p className="opacity-60">
            ไม่มีข้อมูล Saline
          </p>
        ) : (
          <>
            <div className="text-4xl font-bold">
              {data.percentage}%
            </div>

            <div className="text-sm opacity-60">
              Measured:{" "}
              {new Date(
                data.measured_at
              ).toLocaleString()}
            </div>
          </>
        )}

      </div>
    </div>
  );
}