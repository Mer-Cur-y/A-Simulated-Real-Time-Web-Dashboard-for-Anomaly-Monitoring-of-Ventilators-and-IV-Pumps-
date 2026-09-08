"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getPatientSummary,
  type PatientSummary,
} from "@/services/patients/patient-summary.service";

export function usePatientSummary(
  wardId: string
) {

  const [summary, setSummary] =
    useState<PatientSummary>({
      normal: 0,
      warning: 0,
      critical: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadSummary = useCallback(
    async () => {

      try {

        setLoading(true);
        setError("");

        const data =
          await getPatientSummary(wardId);

        setSummary(data);

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "ไม่สามารถโหลดสรุปข้อมูลได้"
        );

      } finally {

        setLoading(false);

      }

    },
    [wardId]
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    reload: loadSummary,
  };
}