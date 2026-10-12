"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  acknowledgeAlert,
  getPatientDeviceOfflineAlerts,
} from "@/services/alerts/alert.service";

interface PatientDeviceOfflineAlert {
  alert_id: string;
  uwid: string;
  device_id: string | null;
  severity: "info" | "warning" | "critical";
  status: "active" | "acknowledged" | "resolved";
  created_at: string;
  alert_type: string;
  alert_message: string | null;
}

interface Props {
  uwid: string;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export default function PatientDeviceOfflineAlert({
  uwid,
}: Props) {
  const [alerts, setAlerts] = useState<
    PatientDeviceOfflineAlert[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState<
    string | null
  >(null);

  async function loadAlerts() {
    try {
      const data =
        await getPatientDeviceOfflineAlerts(uwid);

      setAlerts(data);
    } catch (error) {
      console.error(
        "Failed to load device offline alerts:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initialLoad() {
      try {
        const data =
          await getPatientDeviceOfflineAlerts(uwid);

        if (mounted) {
          setAlerts(data);
        }
      } catch (error) {
        console.error(
          "Failed to load device offline alerts:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    const supabase = createClient();

    const channel = supabase
      .channel(
        `patient-device-alert-${uwid}-${crypto.randomUUID()}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
          filter: `uwid=eq.${uwid}`,
        },
        async () => {
          if (!mounted) return;

          const data =
            await getPatientDeviceOfflineAlerts(uwid);

          if (mounted) {
            setAlerts(data);
          }
        }
      )
      .subscribe((status) => {
        console.log(
          "Patient Device Alert Realtime:",
          status
        );
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [uwid]);

  async function handleAcknowledge(
    alertId: string
  ) {
    try {
      setProcessing(alertId);

      await acknowledgeAlert(alertId);

      await loadAlerts();
    } catch (error) {
      console.error(
        "Failed to acknowledge alert:",
        error
      );
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return null;
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.alert_id}
          className="rounded-2xl border border-warning/40 bg-warning/10 p-4"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/20 text-warning">
                ⚠
              </div>

              <div>
                <h3 className="font-bold text-warning">
                  Device Offline
                </h3>

                <p className="mt-1 text-sm">
                  อุปกรณ์{" "}
                  <span className="font-semibold">
                    {alert.device_id ?? "-"}
                  </span>{" "}
                  ไม่ได้ส่งข้อมูลตามเวลาที่กำหนด
                </p>

                {alert.alert_message && (
                  <p className="mt-1 text-xs text-base-content/60">
                    {alert.alert_message}
                  </p>
                )}

                <p className="mt-2 text-xs text-base-content/50">
                  แจ้งเตือนเมื่อ{" "}
                  {formatTime(alert.created_at)}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-warning btn-sm"
              disabled={processing === alert.alert_id}
              onClick={() =>
                handleAcknowledge(alert.alert_id)
              }
            >
              {processing === alert.alert_id
                ? "กำลังดำเนินการ..."
                : "รับทราบ"}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}