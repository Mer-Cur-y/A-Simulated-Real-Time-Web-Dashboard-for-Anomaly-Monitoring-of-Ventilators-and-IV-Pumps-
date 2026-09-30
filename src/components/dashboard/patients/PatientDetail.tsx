"use client";
import RespiratoryGraph from "./RespiratoryGraph";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  getPatientDetail,
  type PatientDetailData,
} from "@/services/patients/patient-detail.service";

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    {
      label: string;
      className: string;
    }
  > = {
    normal: {
      label: "ปกติ",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    warning: {
      label: "เฝ้าระวัง",
      className: "border border-amber-200 bg-amber-50 text-amber-700",
    },

    critical: {
      label: "วิกฤต",
      className: "border border-red-200 bg-red-50 text-red-700",
    },

    low: {
      label: "ระดับต่ำ",
      className: "border border-amber-200 bg-amber-50 text-amber-700",
    },

    empty: {
      label: "หมด",
      className: "border border-red-200 bg-red-50 text-red-700",
    },
  };

  const item = config[status] ?? {
    label: status,
    className: "border border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  unit,
  status,
}: {
  title: string;
  value: number | null;
  unit: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_2px_12px_rgba(20,83,45,0.05)]">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <StatusBadge status={status} />
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-tight text-slate-800">
          {value ?? "--"}
        </span>

        <span className="mb-1 text-sm text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

export default function PatientDetail({ uwid }: { uwid: string }) {
  const router = useRouter();

  const [data, setData] = useState<PatientDetailData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatient() {
      try {
        setLoading(true);
        setError(null);

        const result = await getPatientDetail(uwid);

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลผู้ป่วยได้",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [uwid]);

  useEffect(() => {
  const supabase = createClient();

  const channel = supabase
    .channel(`patient-detail-${uwid}`)

    // ========================================
    // RESPIRATORY REALTIME
    // ========================================
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "respiratory_data",
        filter: `uwid=eq.${uwid}`,
      },
      (payload) => {
        console.log("PATIENT RESPIRATORY REALTIME:", payload);

        const newData = payload.new as {
          uwid: string;
          device_id: string;
          spo2: number | null;
          heart_rate: number | null;
          measure_at: string;
        };

        setData((current) => {
          if (!current) return current;

          return {
            ...current,

            respiratory: {
              ...current.respiratory,
              ...newData,
            },

            patient: {
              ...current.patient,
              // ค่า respiratory ใหม่จะถูกใช้ในส่วน UI
            },
          };
        });
      },
    )

    // ========================================
    // SALINE REALTIME
    // ========================================
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "saline",
        filter: `uwid=eq.${uwid}`,
      },
      (payload) => {
        console.log("PATIENT SALINE REALTIME:", payload);

        const newData = payload.new as {
          uwid: string;
          device_id: string;
          measure_value: number;
          measure_at: string;
        };

        setData((current) => {
          if (!current) return current;

          return {
            ...current,

            saline: {
              ...current.saline,
              ...newData,
            },
          };
        });
      },
    )

    // ========================================
    // PATIENT STATUS REALTIME
    // ========================================
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "patients_on_wards",
        filter: `uwid=eq.${uwid}`,
      },
      (payload) => {
        console.log("PATIENT STATUS REALTIME:", payload);

        const newData = payload.new as {
          uwid: string;
          monitor_status:
            | "normal"
            | "warning"
            | "critical";
          saline_status:
            | "normal"
            | "low"
            | "empty";
        };

        setData((current) => {
          if (!current) return current;

          return {
            ...current,

            patient: {
              ...current.patient,
              monitor_status: newData.monitor_status,
              saline_status: newData.saline_status,
            },
          };
        });
      },
    )

    // ========================================
    // SUBSCRIBE
    // ========================================
    .subscribe((status) => {
      console.log("Patient Detail Realtime:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [uwid]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3faf7] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
            <span className="loading loading-spinner loading-md text-emerald-600" />

            <p className="mt-3 text-sm text-slate-500">
              กำลังโหลดข้อมูลผู้ป่วย...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f3faf7] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-100 bg-white p-8">
            <h1 className="text-lg font-semibold text-red-700">
              ไม่สามารถโหลดข้อมูลได้
            </h1>

            <p className="mt-2 text-sm text-slate-500">{error}</p>

            <button
              onClick={() => router.back()}
              className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              กลับ
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f3faf7] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
            <p className="text-slate-500">ไม่พบข้อมูลผู้ป่วย</p>
          </div>
        </div>
      </main>
    );
  }

  const { patient, respiratory, saline, devices, alerts } = data;

  return (
    <main className="min-h-screen bg-[#f3faf7] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_2px_12px_rgba(20,83,45,0.05)] md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.back()}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 text-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                aria-label="กลับ"
              >
                ←
              </button>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
                    {patient.first_name} {patient.last_name}
                  </h1>

                  <StatusBadge status={patient.monitor_status} />
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                  <span>{patient.opd}</span>

                  <span>{patient.ward_name}</span>

                  <span>ห้อง {patient.room_number ?? "-"}</span>

                  <span>เตียง {patient.bed_number ?? "-"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs text-slate-500">ข้อมูลล่าสุด</span>

              <span className="text-xs font-medium text-emerald-700">
                {respiratory
                  ? new Date(respiratory.measure_at).toLocaleTimeString("th-TH")
                  : "-"}
              </span>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="SpO₂"
            value={respiratory?.spo2 ?? null}
            unit="%"
            status={patient.monitor_status}
          />

          <MetricCard
            title="Heart Rate"
            value={respiratory?.heart_rate ?? null}
            unit="bpm"
            status={patient.monitor_status}
          />

          <MetricCard
            title="Saline"
            value={saline?.measure_value ?? null}
            unit="%"
            status={patient.saline_status}
          />
        </section>

        {/* Graph Placeholder */}
        <RespiratoryGraph uwid={patient.uwid} />

        {/* Patient + Devices */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Patient information */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_2px_12px_rgba(20,83,45,0.05)]">
            <h2 className="text-lg font-semibold text-slate-800">
              ข้อมูลผู้ป่วย
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <p className="text-xs text-slate-400">OPD</p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {patient.opd}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">เพศ</p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {patient.gender ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">วันเกิด</p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {patient.birthdate ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Ward</p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {patient.ward_name}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">ห้อง</p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {patient.room_number ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">เตียง</p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {patient.bed_number ?? "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Devices */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_2px_12px_rgba(20,83,45,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Devices</h2>

              <span className="text-xs text-slate-400">
                {devices.length} อุปกรณ์
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {devices.length === 0 ? (
                <p className="text-sm text-slate-400">ไม่มีอุปกรณ์</p>
              ) : (
                devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/30 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {device.device_type}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {device.device_uid}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          device.status === "online"
                            ? "bg-emerald-50 text-emerald-700"
                            : device.status === "maintenance"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />

                        {device.status}
                      </span>

                      <p className="mt-1 text-xs text-slate-400">
                        {device.last_seen
                          ? new Date(device.last_seen).toLocaleString("th-TH")
                          : "-"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_2px_12px_rgba(20,83,45,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Alerts</h2>

              <p className="mt-1 text-sm text-slate-400">
                เหตุการณ์ที่ต้องติดตาม
              </p>
            </div>

            <span className="text-xs text-slate-400">
              {alerts.length} รายการ
            </span>
          </div>

          <div className="mt-5">
            {alerts.length === 0 ? (
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                ไม่มี Alert ที่ต้องติดตาม
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
                  >
                    <div>
                      <StatusBadge status={alert.severity} />

                      <p className="mt-2 text-sm text-slate-600">
                        ค่า {alert.value ?? "-"}
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-400">
                      <p>{alert.status}</p>

                      <p className="mt-1">
                        {new Date(alert.created_at).toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
