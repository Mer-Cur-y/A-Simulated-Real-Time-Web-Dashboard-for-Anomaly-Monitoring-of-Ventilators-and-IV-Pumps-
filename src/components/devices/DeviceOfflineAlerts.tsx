"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  getDeviceOfflineAlerts,
  type DeviceOfflineAlert,
} from "@/services/alerts/alert.service";

function formatTime(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export default function DeviceOfflineAlerts() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<
    DeviceOfflineAlert[]
  >([]);

  const [loading, setLoading] = useState(true);

  async function loadAlerts() {
    try {
      const data = await getDeviceOfflineAlerts();

      setAlerts(data);
    } catch (error) {
      console.error(
        "Failed to load device offline alerts:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();

    const supabase = createClient();

    const channel = supabase
      .channel(
        `device-offline-alerts-${crypto.randomUUID()}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
        },
        () => {
          loadAlerts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <section className="mt-8">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6">
          <p className="text-sm text-base-content/60">
            กำลังตรวจสอบ Device Alert...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          Device Alerts
        </h2>

        <p className="mt-1 text-sm text-base-content/60">
          อุปกรณ์ที่มีปัญหาการเชื่อมต่อ
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-success/20 bg-success/10 p-5">
          <p className="font-medium text-success">
            ✓ ไม่มี Device Offline
          </p>

          <p className="mt-1 text-sm text-success/70">
            อุปกรณ์ทั้งหมดที่กำลังติดตามไม่มี Offline Alert
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <button
              key={alert.alert_id}
              type="button"
              className="w-full rounded-2xl border border-warning/30 bg-base-100 p-5 text-left shadow-sm transition hover:border-warning hover:shadow-md"
              onClick={() =>
                router.push(
                  `/dashboard/patients/${alert.uwid}`,
                )
              }
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-warning" />

                    <span className="font-semibold">
                      Device Offline
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium">
                    {alert.device_id ?? "ไม่ทราบ Device"}
                  </p>

                  <p className="mt-1 text-sm text-base-content/60">
                    {alert.first_name
                      ? `${alert.first_name} ${alert.last_name ?? ""}`
                      : "ไม่พบข้อมูลผู้ป่วย"}
                  </p>
                </div>

                <div className="text-sm md:text-right">
                  {alert.ward_name && (
                    <p>
                      {alert.ward_name}
                    </p>
                  )}

                  {(alert.room_number ||
                    alert.bed_number) && (
                    <p className="text-base-content/60">
                      ห้อง {alert.room_number ?? "-"}{" "}
                      · เตียง{" "}
                      {alert.bed_number ?? "-"}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-base-content/50">
                    {formatTime(alert.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}