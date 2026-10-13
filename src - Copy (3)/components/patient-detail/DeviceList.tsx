import type { PatientDevice } from "@/types/patient-detail";

interface Props {
  devices: PatientDevice[];
}

export default function DeviceList({
  devices,
}: Props) {
  return (
    <div className="card bg-base-100 shadow-sm border">
      <div className="card-body">

        <h2 className="card-title">
          Devices
        </h2>

        {devices.length === 0 ? (
          <p className="opacity-60">
            ไม่พบ Device
          </p>
        ) : (
          <div className="space-y-3">

            {devices.map((device) => (
              <div
                key={device.id}
                className="border rounded-lg p-4"
              >
                <div className="font-semibold">
                  {device.device_uid}
                </div>

                <div className="text-sm">
                  Type: {device.device_type}
                </div>

                <div className="text-sm">
                  Status: {device.status}
                </div>

                <div className="text-sm opacity-60">
                  Last Seen:{" "}
                  {device.last_seen
                    ? new Date(
                        device.last_seen
                      ).toLocaleString()
                    : "-"}
                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}