import type { RespiratoryData } from "@/types/patient-detail";

interface Props {
  data: RespiratoryData | null;
}

export default function RespiratoryInfo({
  data,
}: Props) {
  return (
    <div className="card bg-base-100 shadow-sm border">
      <div className="card-body">

        <h2 className="card-title">
          Respiratory
        </h2>

        {!data ? (
          <p className="opacity-60">
            ไม่มีข้อมูล Respiratory
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">

            <div>
              <div className="text-sm opacity-60">
                Tidal Volume
              </div>

              <div className="font-bold">
                {data.tidals_volums ?? "-"} mL
              </div>
            </div>

            <div>
              <div className="text-sm opacity-60">
                SpO₂
              </div>

              <div className="font-bold">
                {data.spo2 ?? "-"} %
              </div>
            </div>

            <div>
              <div className="text-sm opacity-60">
                Heart Rate
              </div>

              <div className="font-bold">
                {data.heart_rate ?? "-"} bpm
              </div>
            </div>

            <div>
              <div className="text-sm opacity-60">
                Peak Pressure
              </div>

              <div className="font-bold">
                {data.peak_pressure ?? "-"} cmH₂O
              </div>
            </div>

            <div>
              <div className="text-sm opacity-60">
                Leak
              </div>

              <div className="font-bold">
                {data.leak ?? "-"} %
              </div>
            </div>

            <div>
              <div className="text-sm opacity-60">
                Measured
              </div>

              <div className="text-sm">
                {new Date(
                  data.measured_at
                ).toLocaleString()}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}