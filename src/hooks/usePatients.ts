"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getPatients } from "@/services/patients/patient.service";
import type { PatientDashboard } from "@/types/patient";

export function usePatients(
  wardId: string,
  status: string
) {
  const [patients, setPatients] =
    useState<PatientDashboard[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadPatients = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPatients(
          wardId,
          status
        );

        setPatients(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "ไม่สามารถโหลดข้อมูลผู้ป่วยได้"
        );
      } finally {
        setLoading(false);
      }
    },
    [wardId, status]
  );

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  return {
    patients,
    loading,
    error,
    reload: loadPatients,
  };
}