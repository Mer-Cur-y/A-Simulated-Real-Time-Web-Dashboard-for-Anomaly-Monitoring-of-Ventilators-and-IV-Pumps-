"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getPatients } from "@/services/patients/patient.service";
import type {
  MonitorStatus,
  PatientDashboard,
  SalineStatus,
} from "@/types/patient";

interface UsePatientsOptions {
  wardId?: string;
  monitorStatus?: MonitorStatus | "all";
  salineStatus?: SalineStatus | "all";
}

interface UsePatientsResult {
  patients: PatientDashboard[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePatients(
  options: UsePatientsOptions = {}
): UsePatientsResult {
  const {
    wardId,
    monitorStatus = "all",
    salineStatus = "all",
  } = options;

  const [patients, setPatients] = useState<PatientDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getPatients();

      setPatients(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ไม่สามารถโหลดข้อมูลผู้ป่วยได้");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (wardId && wardId !== "all") {
        if (patient.ward_id !== wardId) {
          return false;
        }
      }

      if (
        monitorStatus &&
        monitorStatus !== "all" &&
        patient.monitor_status !== monitorStatus
      ) {
        return false;
      }

      if (
        salineStatus &&
        salineStatus !== "all" &&
        patient.saline_status !== salineStatus
      ) {
        return false;
      }

      return true;
    });
  }, [patients, wardId, monitorStatus, salineStatus]);

  return {
    patients: filteredPatients,
    loading,
    error,
    refetch: loadPatients,
  };
}