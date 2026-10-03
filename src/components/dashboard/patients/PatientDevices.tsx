"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  getPatientDevices,
} from "@/services/devices/device.service";
import type { Device } from "@/types/device";

function getTypeLabel(
  type: Device["device_type"],
) {
  switch (type) {
    case "respiratory":
      return "Respiratory";

    case "saline":
      return "Saline";

    case "multi_sensor":
      return "Multi Sensor";

    default:
      return type;
  }
}

function getStatus(
  status: Device["status"],
) {
  switch (status) {
    case "online":
      return {
        label: "Online",
        dot: "bg-success",
        text: "text-success",
      };

    case "offline":
      return {
        label: "Offline",
        dot: "bg-error",
        text: "text-error",
      };

    case "maintenance":
      return {
        label: "Maintenance",
        dot: "bg-warning",
        text: "text-warning",
      };

    default:
      return {
        label: status,
        dot: "bg-base-content/30",
        text: "text-base-content/60",
      };
  }
}

function formatLastSeen(
  value: string | null,
) {
  if (!value) {
    return "ยังไม่เคยเชื่อมต่อ";
  }

  return new Date(value).toLocaleString(
    "th-TH",
    {
      dateStyle: "short",
      timeStyle: "medium",
    },
  );
}

interface PatientDevicesProps {
  uwid: string;
}

export default function PatientDevices({
  uwid,
}: PatientDevicesProps) {
  const [devices, setDevices] = useState<Device[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDevices() {
      try {
        const data =
          await getPatientDevices(uwid);

        if (mounted) {
          setDevices(data);
        }
      } catch (error) {
        console.error(
          "Failed to load patient devices:",
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDevices();

    const supabase = createClient();

    const channel = supabase
      .channel(
        `patient-devices-${uwid}-${crypto.randomUUID()}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "devices",
          filter: `uwid=eq.${uwid}`,
        },
        async () => {
          const data =
            await getPatientDevices(uwid);

          if (mounted) {
            setDevices(data);
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [uwid]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
        <p className="text-sm text-base-content/60">
          กำลังโหลดอุปกรณ์...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold">
          Connected Devices
        </h2>

        <p className="mt-1 text-sm text-base-content/60">
          อุปกรณ์ที่เชื่อมต่อกับผู้ป่วยรายนี้
        </p>
      </div>

      {devices.length === 0 ? (
        <div className="rounded-xl bg-base-200 p-5 text-center">
          <p className="text-sm text-base-content/60">
            ยังไม่มี Device ที่เชื่อมต่อ
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {devices.map((device) => {
            const status =
              getStatus(device.status);

            return (
              <div
                key={device.id}
                className="rounded-xl border border-base-300 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {getTypeLabel(
                        device.device_type,
                      )}
                    </p>

                    <p className="mt-1 text-sm text-base-content/60">
                      {device.device_uid}
                    </p>
                  </div>

                  <span
                    className={`flex items-center gap-2 text-sm font-medium ${status.text}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${status.dot}`}
                    />

                    {status.label}
                  </span>
                </div>

                <div className="mt-4 border-t border-base-200 pt-3">
                  <p className="text-xs text-base-content/50">
                    Last seen
                  </p>

                  <p className="mt-1 text-sm">
                    {formatLastSeen(
                      device.last_seen,
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}