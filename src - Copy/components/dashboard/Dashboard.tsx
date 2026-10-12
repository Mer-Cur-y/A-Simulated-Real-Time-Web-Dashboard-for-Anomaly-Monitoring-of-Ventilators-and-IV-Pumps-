"use client";

import DeviceOfflineAlerts from "@/components/devices/DeviceOfflineAlerts";
import DeviceManagement from "@/components/devices/DeviceManagement";
import { useMemo, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import { useRouter } from "next/navigation";

import { usePatients } from "@/hooks/usePatients";
import { useWards } from "@/hooks/useWards";

import StatusSummary from "./StatusSummary";
import WardFilter from "./WardFilter";
import PatientList from "./patients/PatientList";

type PatientStatusFilter = "all" | "normal" | "warning" | "critical";

export default function Dashboard() {
  const [selectedWardId, setSelectedWardId] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>("all");

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

  const getPatientSeverity = (
    patient: (typeof patients)[number],
  ): "normal" | "warning" | "critical" => {
    if (
      patient.monitor_status === "critical" ||
      patient.saline_status === "empty"
    ) {
      return "critical";
    }

    if (
      patient.monitor_status === "warning" ||
      patient.saline_status === "low"
    ) {
      return "warning";
    }

    return "normal";
  };

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("th-TH");

    return patients.filter((patient) => {
      const searchableText = [
        patient.first_name,
        patient.last_name,
        patient.uwid,
        patient.ward_name,
        patient.room_number,
        patient.bed_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("th-TH");

      const matchesSearch = !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "all" || getPatientSeverity(patient) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const handlePatientClick = (patient: (typeof patients)[number]) => {
    router.push(`/dashboard/patients/${patient.uwid}`);
  };

  const selectedWardName =
    selectedWardId === "all"
      ? "ทุก Ward"
      : (wards.find((ward) => ward.wid === selectedWardId)?.name ?? "-");

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <Topbar
          title="Patient Dashboard"
          description="ระบบติดตามและดูแลผู้ป่วย"
        />

        {/* Ward filter: แยกออกจาก Topbar */}
        <div className="relative z-0 mt-4 flex w-full min-w-0 justify-end">
          {wardsError ? (
            <p className="text-sm text-error">{wardsError}</p>
          ) : 
          (
            <div className="w-full min-w-0 sm:w-auto sm:min-w-64">
              <WardFilter
                wards={wards}
                selectedWardId={selectedWardId}
                onWardChange={setSelectedWardId}
              />
            </div>
          )}
        </div>

        {/* สรุปสถานะผู้ป่วย */}
        <StatusSummary
          total={summary.total}
          normal={summary.normal}
          warning={summary.warning}
          critical={summary.critical}
          salineLow={summary.salineLow}
          salineEmpty={summary.salineEmpty}
        />

        {/* ค้นหาและกรองผู้ป่วย */}
        <section className="mt-6 rounded-2xl border border-base-300 bg-base-100 p-4 md:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">รายชื่อผู้ป่วย</h2>
            <p className="mt-1 text-sm text-base-content/60">
              แสดง {filteredPatients.length} จาก {patients.length} ราย
              {!wardsLoading && ` · ${selectedWardName}`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="input input-bordered flex w-full items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 opacity-50"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="search"
                className="grow"
                placeholder="ค้นหาชื่อ นามสกุล หรือรหัสผู้ป่วย"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="ค้นหาผู้ป่วย"
              />
            </label>

            <select
              className="select select-bordered w-full"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as PatientStatusFilter)
              }
              aria-label="กรองตามสถานะผู้ป่วย"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </section>

        {/* การ์ดผู้ป่วย */}
        <div className="mt-4">
          <PatientList
            patients={filteredPatients}
            loading={patientsLoading}
            error={patientsError}
            onPatientClick={handlePatientClick}
          />
        </div>
      </div>
    </main>
  );
}
