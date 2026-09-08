"use client";

import PatientInfo from "./PatientInfo";
import DeviceList from "./DeviceList";
import SalineInfo from "./SalineInfo";
import RespiratoryInfo from "./RespiratoryInfo";
import AlertList from "./AlertList";
import ActivityList from "./ActivityList";

import { usePatientDetail } from "@/hooks/usePatientDetail";

interface Props {
  patientId: string;
}

export default function PatientDetail({
  patientId,
}: Props) {
  const {
    data,
    loading,
    error,
  } = usePatientDetail(patientId);

  if (loading) {
    return (
      <main className="p-6">
        <span className="loading loading-spinner loading-lg" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <div className="alert alert-error">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-6">
        <div className="alert">
          ไม่พบข้อมูลผู้ป่วย
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 p-6">

      <div className="max-w-7xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            {data.patient.first_name}{" "}
            {data.patient.last_name}
          </h1>

          <p className="opacity-60">
            Patient Detail
          </p>
        </div>

        <PatientInfo
          patient={data.patient}
        />

        <DeviceList
          devices={data.devices}
        />

        <SalineInfo
          data={data.saline}
        />

        <RespiratoryInfo
          data={data.respiratory}
        />

        <AlertList
          alerts={data.alerts}
        />

        <ActivityList
          activities={data.activities}
        />

      </div>

    </main>
  );
}