"use client";

import { useState } from "react";

import WardFilter from "./WardFilter";
import PatientList from "./patients/PatientList";

import { useWards } from "@/hooks/useWards";
import { usePatients } from "@/hooks/usePatients";

export default function Dashboard() {
  const [wardId, setWardId] = useState("all");

  const {
    wards,
    loading: wardsLoading,
  } = useWards();

  const {
  patients,
  loading: patientsLoading,
  error: patientsError,
} = usePatients(
  wardId,
  status
);

  return (
    <main className="min-h-screen bg-base-200 p-6">

      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="mb-6">

          <h1 className="text-3xl font-bold">
            Patient Dashboard
          </h1>

          <p className="opacity-60">
            ระบบติดตามและเฝ้าระวังผู้ป่วย
          </p>

        </div>

        {/* Filter */}

        {!wardsLoading && (
          <div className="mb-6">
            <WardFilter
              wards={wards}
              value={wardId}
              onChange={setWardId}
            />
          </div>
        )}

        {/* Patient list */}

        <PatientList
          patients={patients}
          loading={patientsLoading}
          error={patientsError}
        />

      </div>

    </main>
  );
}