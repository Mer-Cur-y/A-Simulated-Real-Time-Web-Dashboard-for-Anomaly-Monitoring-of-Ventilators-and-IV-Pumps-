"use client";
import DeviceOfflineAlerts from "@/components/devices/DeviceOfflineAlerts";
import DeviceManagement from "@/components/devices/DeviceManagement";
import DeviceMonitoring from "@/components/devices/DeviceMonitoring";
import GlobalAlertNotification from "@/components/dashboard/alerts/GlobalAlertNotification";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { usePatients } from "@/hooks/usePatients";
import { useWards } from "@/hooks/useWards";

import StatusSummary from "./StatusSummary";
import WardFilter from "./WardFilter";
import PatientList from "./patients/PatientList";

export default function Dashboard() {
  const [selectedWardId, setSelectedWardId] = useState("all");

  const router = useRouter();

  const { wards, loading: wardsLoading, error: wardsError } = useWards();

  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
  } = usePatients({
    wardId: selectedWardId,
  });

  const summary = useMemo(() => {
    return {
      total: patients.length,

      normal: patients.filter((patient) => patient.monitor_status === "normal")
        .length,

      warning: patients.filter(
        (patient) => patient.monitor_status === "warning",
      ).length,

      critical: patients.filter(
        (patient) => patient.monitor_status === "critical",
      ).length,

      salineLow: patients.filter((patient) => patient.saline_status === "low")
        .length,

      salineEmpty: patients.filter(
        (patient) => patient.saline_status === "empty",
      ).length,
    };
  }, [patients]);

  const handlePatientClick = (patient: (typeof patients)[number]) => {
    router.push(`/dashboard/patients/${patient.uwid}`);
  };

  const selectedWardName =
    selectedWardId === "all"
      ? "ทุก Ward"
      : (wards.find((ward) => ward.wid === selectedWardId)?.name ?? "-");

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Patient Dashboard
            </h1>

            <p className="mt-1 text-sm text-base-content/60">
              ระบบติดตามและดูแลผู้ป่วย
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Alert Notification */}
            <GlobalAlertNotification />

            {wardsError ? (
              <div className="text-sm text-error">{wardsError}</div>
            ) : (
              <WardFilter
                wards={wards}
                selectedWardId={selectedWardId}
                onWardChange={setSelectedWardId}
              />
            )}
          </div>
        </div>

        {/* Status Summary */}
        <StatusSummary
          total={summary.total}
          normal={summary.normal}
          warning={summary.warning}
          critical={summary.critical}
          salineLow={summary.salineLow}
          salineEmpty={summary.salineEmpty}
        />

        {/* Patient List */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">รายชื่อผู้ป่วย</h2>

              <p className="text-sm text-base-content/60">
                แสดง {patients.length} ราย
              </p>
            </div>

            {!wardsLoading && (
              <div className="text-sm text-base-content/50">
                {selectedWardName}
              </div>
            )}
          </div>

          <PatientList
            patients={patients}
            loading={patientsLoading}
            error={patientsError}
            onPatientClick={handlePatientClick}
          />
        </section>
        <DeviceMonitoring />

        <DeviceOfflineAlerts />

        <DeviceManagement />
      </div>
    </main>
  );
}
