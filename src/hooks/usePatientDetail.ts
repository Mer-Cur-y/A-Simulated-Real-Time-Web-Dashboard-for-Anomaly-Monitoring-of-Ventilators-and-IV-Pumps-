"use client";

import { useEffect, useState } from "react";

import { getPatientDetail } from "@/services/patients/patient-detail.service";
import type { PatientDetailData } from "@/types/patient-detail";

export function usePatientDetail(patientId: string) {
  const [data, setData] =
    useState<PatientDetailData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadPatientDetail() {
      try {
        setLoading(true);
        setError("");

        const result =
          await getPatientDetail(patientId);

        setData(result);

      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "ไม่สามารถโหลดข้อมูลผู้ป่วยได้"
        );
      } finally {
        setLoading(false);
      }
    }

    if (patientId) {
      loadPatientDetail();
    }
  }, [patientId]);

  return {
    data,
    loading,
    error,
  };
}