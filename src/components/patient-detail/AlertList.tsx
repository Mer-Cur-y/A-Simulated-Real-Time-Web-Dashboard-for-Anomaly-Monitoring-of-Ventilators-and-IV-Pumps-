import type { PatientAlert } from "@/types/patient-detail";

interface Props {
  alerts: PatientAlert[];
}

export default function AlertList({
  alerts,
}: Props) {
  return (
    <div className="card bg-base-100 shadow-sm border">
      <div className="card-body">

        <h2 className="card-title">
          Alerts
        </h2>

        {alerts.length === 0 ? (
          <p className="opacity-60">
            ไม่มี Alert
          </p>
        ) : (
          <div className="space-y-3">

            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4"
              >

                <div className="flex justify-between">

                  <div>
                    <div className="font-bold">
                      {alert.title}
                    </div>

                    <div className="text-sm">
                      {alert.type}
                    </div>
                  </div>

                  <div>
                    {alert.severity.toUpperCase()}
                  </div>

                </div>

                <div className="text-sm mt-2">
                  Value: {alert.value ?? "-"}
                </div>

                <div className="text-sm">
                  Threshold:{" "}
                  {alert.threshold ?? "-"}
                </div>

                <div className="text-sm">
                  Status: {alert.status}
                </div>

                <div className="text-sm opacity-60">
                  {new Date(
                    alert.created_at
                  ).toLocaleString()}
                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}