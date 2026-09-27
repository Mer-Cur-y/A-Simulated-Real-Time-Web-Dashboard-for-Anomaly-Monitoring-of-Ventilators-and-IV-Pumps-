"use client";

import { useEffect, useState } from "react";

import { getPatientDetail } from "@/services/patients/patient-detail.service";
import type { PatientDetailData } from "@/types/patient-detail";

interface PatientDetailClientProps {
  uwid: string;
}

export default function PatientDetailClient({
  uwid,
}: PatientDetailClientProps) {
  const [data, setData] = useState<PatientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPatient() {
      try {
        setLoading(true);
        setError(null);

        const result = await getPatientDetail(uwid);

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "ไม่สามารถโหลดข้อมูลผู้ป่วยได้"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPatient();

    return () => {
      cancelled = true;
    };
  }, [uwid]);

  if (loading) {
    return (
      <main className="min-h-screen bg-base-200 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl bg-base-100 p-6 shadow">
            กำลังโหลดข้อมูลผู้ป่วย...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-base-200 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-error/30 bg-base-100 p-6">
            <h1 className="text-xl font-bold text-error">
              ไม่สามารถโหลดข้อมูลได้
            </h1>

            <p className="mt-2 text-sm text-base-content/70">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-base-200 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl bg-base-100 p-6 shadow">
            ไม่พบข้อมูลผู้ป่วย
          </div>
        </div>
      </main>
    );
  }

  const {
    patient,
    devices,
    saline,
    respiratory,
    alerts,
    activities,
  } = data;

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="rounded-xl bg-base-100 p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-base-content/50">
                OPD: {patient.opd}
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                {patient.first_name} {patient.last_name}
              </h1>

              <p className="mt-2 text-sm text-base-content/60">
                {patient.ward_name}
                {patient.room_number
                  ? ` • ห้อง ${patient.room_number}`
                  : ""}
                {patient.bed_number
                  ? ` • เตียง ${patient.bed_number}`
                  : ""}
              </p>
            </div>

            <div className="flex gap-2">
              <span className="badge badge-outline">
                {patient.monitor_status}
              </span>

              <span className="badge badge-outline">
                Saline: {patient.saline_status}
              </span>
            </div>
          </div>
        </section>

        {/* Monitoring */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            การติดตามผู้ป่วย
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-base-100 p-5 shadow">
              <p className="text-sm text-base-content/60">
                SpO₂
              </p>

              <p className="mt-2 text-3xl font-bold">
                {respiratory?.spo2 ?? "-"}
                {respiratory?.spo2 != null ? "%" : ""}
              </p>
            </div>

            <div className="rounded-xl bg-base-100 p-5 shadow">
              <p className="text-sm text-base-content/60">
                Heart Rate
              </p>

              <p className="mt-2 text-3xl font-bold">
                {respiratory?.heart_rate ?? "-"}
                {respiratory?.heart_rate != null ? " bpm" : ""}
              </p>
            </div>

            <div className="rounded-xl bg-base-100 p-5 shadow">
              <p className="text-sm text-base-content/60">
                Saline
              </p>

              <p className="mt-2 text-3xl font-bold">
                {saline?.measure_value ?? "-"}
                {saline ? " %" : ""}
              </p>
            </div>

          </div>
        </section>

        {/* Patient information */}
        <section className="rounded-xl bg-base-100 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">
            ข้อมูลผู้ป่วย
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-sm text-base-content/50">
                เพศ
              </p>
              <p className="font-medium">
                {patient.gender ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-base-content/50">
                วันเกิด
              </p>
              <p className="font-medium">
                {patient.birthdate ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-base-content/50">
                เบอร์โทร
              </p>
              <p className="font-medium">
                {patient.phone ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-base-content/50">
                ผู้ติดต่อ
              </p>
              <p className="font-medium">
                {patient.contact_person ?? "-"}
              </p>
            </div>

          </div>
        </section>

        {/* Devices */}
        <section className="rounded-xl bg-base-100 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">
            อุปกรณ์
          </h2>

          {devices.length === 0 ? (
            <p className="text-sm text-base-content/50">
              ไม่มีอุปกรณ์
            </p>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-col gap-2 rounded-lg border border-base-300 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {device.device_uid}
                    </p>

                    <p className="text-sm text-base-content/60">
                      {device.device_type}
                    </p>
                  </div>

                  <span className="badge badge-outline">
                    {device.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Alerts */}
        <section className="rounded-xl bg-base-100 p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Alerts
            </h2>

            <span className="badge badge-outline">
              {alerts.length}
            </span>
          </div>

          {alerts.length === 0 ? (
            <p className="mt-4 text-sm text-base-content/50">
              ยังไม่มี Alert
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="rounded-lg border border-base-300 p-4"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      {alert.severity}
                    </span>

                    <span className="text-sm text-base-content/50">
                      {alert.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm">
                    Value: {alert.value ?? "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Activity */}
        <section className="rounded-xl bg-base-100 p-6 shadow">
          <h2 className="text-lg font-semibold">
            Activity Log
          </h2>

          {activities.length === 0 ? (
            <p className="mt-4 text-sm text-base-content/50">
              ยังไม่มีกิจกรรม
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.act_id}
                  className="rounded-lg border border-base-300 p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {activity.action_type}
                      </p>

                      <p className="mt-1 text-sm text-base-content/70">
                        {activity.description ?? "-"}
                      </p>
                    </div>

                    <span className="text-xs text-base-content/50">
                      {new Date(
                        activity.created_at
                      ).toLocaleString("th-TH")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}