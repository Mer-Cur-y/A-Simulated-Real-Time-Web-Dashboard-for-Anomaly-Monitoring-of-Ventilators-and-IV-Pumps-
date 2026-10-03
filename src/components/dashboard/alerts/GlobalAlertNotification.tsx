"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AlertRow {
  alert_id: string;
  uwid: string;
  aid: string;
  device_id: string | null;
  severity: "info" | "warning" | "critical";
  value: number | null;
  status: "active" | "acknowledged" | "resolved";
  created_at: string;
}

interface PatientInfo {
  uwid: string;
  first_name: string;
  last_name: string;
  ward_name: string;
  room_number: string | null;
  bed_number: string | null;
}

interface AlertType {
  aid: string;
  alert_type: string;
  alert_message: string | null;
  primary_variables: string | null;
}

interface NotificationItem extends AlertRow {
  patient: PatientInfo | null;
  alertType: AlertType | null;
}

function severityLabel(severity: string) {
  switch (severity) {
    case "critical":
      return "วิกฤต";

    case "warning":
      return "เฝ้าระวัง";

    case "info":
      return "ข้อมูล";

    default:
      return severity;
  }
}

function severityClass(severity: string) {
  switch (severity) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";

    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function getAlertTitle(alertType: AlertType | null) {
  if (!alertType) {
    return "มีการแจ้งเตือนใหม่";
  }

  return alertType.alert_message ?? "มีการแจ้งเตือนใหม่";
}

function getMetricName(alertType: AlertType | null) {
  switch (alertType?.primary_variables) {
    case "spo2":
      return "SpO₂";

    case "heart_rate":
      return "Heart Rate";

    case "measure_value":
      return "Saline";

    default:
      return null;
  }
}

export default function GlobalAlertNotification() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [popup, setPopup] = useState<NotificationItem | null>(null);

  const activeCount = useMemo(
    () => notifications.filter((item) => item.status === "active").length,
    [notifications],
  );

  useEffect(() => {
    const supabase = createClient();

    async function loadInitialAlerts() {
      const { data: alerts, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        })
        .limit(20);

      if (error) {
        console.error("Load global alerts error:", error);
        return;
      }

      if (!alerts || alerts.length === 0) {
        return;
      }

      const uwids = [...new Set(alerts.map((alert) => alert.uwid))];

      const aids = [...new Set(alerts.map((alert) => alert.aid))];

      const [{ data: patients }, { data: alertTypes }] = await Promise.all([
        supabase
          .from("patient_dashboard")
          .select(
            `
              uwid,
              first_name,
              last_name,
              ward_name,
              room_number,
              bed_number
              `,
          )
          .in("uwid", uwids),

        supabase
          .from("alert_types")
          .select(
            `
              aid,
              alert_type,
              alert_message,
              primary_variables
              `,
          )
          .in("aid", aids),
      ]);

      const patientMap = new Map(
        (patients ?? []).map((patient) => [
          patient.uwid,
          patient as PatientInfo,
        ]),
      );

      const alertTypeMap = new Map(
        (alertTypes ?? []).map((type) => [type.aid, type as AlertType]),
      );

      setNotifications(
        alerts.map((alert) => ({
          ...(alert as AlertRow),
          patient: patientMap.get(alert.uwid) ?? null,
          alertType: alertTypeMap.get(alert.aid) ?? null,
        })),
      );
    }

    loadInitialAlerts();

    const channel = supabase
      .channel("global-alert-notification")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        async (payload) => {
          const alert = payload.new as AlertRow;

          if (alert.status !== "active") {
            return;
          }

          const [{ data: patient }, { data: alertType }] = await Promise.all([
            supabase
              .from("patient_dashboard")
              .select(
                `
                  uwid,
                  first_name,
                  last_name,
                  ward_name,
                  room_number,
                  bed_number
                  `,
              )
              .eq("uwid", alert.uwid)
              .maybeSingle(),

            supabase
              .from("alert_types")
              .select(
                `
                  aid,
                  alert_type,
                  alert_message,
                  primary_variables
                  `,
              )
              .eq("aid", alert.aid)
              .maybeSingle(),
          ]);

          const notification: NotificationItem = {
            ...alert,
            patient: patient as PatientInfo | null,
            alertType: alertType as AlertType | null,
          };

          setNotifications((current) => {
            const exists = current.some(
              (item) => item.alert_id === alert.alert_id,
            );

            if (exists) {
              return current;
            }

            return [notification, ...current].slice(0, 20);
          });

          setPopup(notification);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          const updated = payload.new as AlertRow;

          setNotifications((current) =>
            current
              .map((item) =>
                item.alert_id === updated.alert_id
                  ? {
                      ...item,
                      ...updated,
                    }
                  : item,
              )
              .filter((item) => item.status === "active"),
          );

          setPopup((current) => {
            if (!current) {
              return current;
            }

            if (current.alert_id !== updated.alert_id) {
              return current;
            }

            if (updated.status !== "active") {
              return null;
            }

            return {
              ...current,
              ...updated,
            };
          });
        },
      )
      .subscribe((status) => {
        console.log("Global Alert Realtime:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function openPatient(uwid: string) {
    setPopup(null);
    setShowNotifications(false);

    router.push(`/dashboard/patients/${uwid}`);
  }

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications((current) => !current)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-lg text-slate-600 transition hover:bg-emerald-50"
          aria-label="การแจ้งเตือน"
        >
          🔔
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {activeCount > 99 ? "99+" : activeCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}

        {showNotifications && (
          <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="font-semibold text-slate-800">การแจ้งเตือน</h3>

                <p className="text-xs text-slate-400">
                  {activeCount} รายการที่ต้องติดตาม
                </p>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  ไม่มีการแจ้งเตือน
                </div>
              ) : (
                notifications.map((item) => {
                  const metricName = getMetricName(item.alertType);

                  return (
                    <button
                      key={item.alert_id}
                      onClick={() => openPatient(item.uwid)}
                      className="block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${severityClass(item.severity)}`}
                        >
                          {severityLabel(item.severity)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-700">
                            {item.patient
                              ? `${item.patient.first_name} ${item.patient.last_name}`
                              : "ไม่พบข้อมูลผู้ป่วย"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {getAlertTitle(item.alertType)}
                          </p>

                          {metricName && (
                            <p className="mt-1 text-xs text-slate-400">
                              {metricName}: {item.value ?? "-"}
                            </p>
                          )}

                          <p className="mt-1 text-[11px] text-slate-400">
                            {new Date(item.created_at).toLocaleString("th-TH")}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {/* Global Popup */}
      {popup && (
        <div className="fixed bottom-5 right-5 z-[100] w-[380px] max-w-[calc(100vw-2rem)]">
          <div
            className={`rounded-2xl border bg-white p-5 shadow-2xl ${
              popup.severity === "critical"
                ? "border-red-200"
                : popup.severity === "warning"
                  ? "border-amber-200"
                  : "border-sky-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${
                    popup.severity === "critical"
                      ? "bg-red-500"
                      : popup.severity === "warning"
                        ? "bg-amber-500"
                        : "bg-sky-500"
                  }`}
                />

                <p className="text-sm font-semibold text-slate-800">
                  มีการแจ้งเตือนใหม่
                </p>
              </div>

              <button
                onClick={() => setPopup(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="ปิด"
              >
                ×
              </button>
            </div>

            <div className="mt-4">
              <p className="text-lg font-semibold text-slate-800">
                {popup.patient
                  ? `${popup.patient.first_name} ${popup.patient.last_name}`
                  : "ไม่พบข้อมูลผู้ป่วย"}
              </p>

              {popup.patient && (
                <p className="mt-1 text-xs text-slate-400">
                  {popup.patient.ward_name}
                  {" • "}
                  ห้อง {popup.patient.room_number ?? "-"}
                  {" • "}
                  เตียง {popup.patient.bed_number ?? "-"}
                </p>
              )}

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">
                  {getAlertTitle(popup.alertType)}
                </p>

                {getMetricName(popup.alertType) && (
                  <p className="mt-1 text-sm text-slate-500">
                    {getMetricName(popup.alertType)}: {popup.value ?? "-"}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(popup.severity)}`}
                >
                  {severityLabel(popup.severity)}
                </span>

                <button
                  onClick={() => openPatient(popup.uwid)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                >
                  ดูผู้ป่วย
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
