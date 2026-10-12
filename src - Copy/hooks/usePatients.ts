"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
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
  options: UsePatientsOptions = {},
): UsePatientsResult {
  const { wardId, monitorStatus = "all", salineStatus = "all" } = options;

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

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("dashboard-patients")

      // respiratory
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "respiratory_data",
        },
        (payload) => {
          const newData = payload.new as {
            uwid: string;
            spo2: number | null;
            heart_rate: number | null;
          };

          setPatients((current) =>
            current.map((patient) =>
              patient.uwid === newData.uwid
                ? {
                    ...patient,
                    spo2: newData.spo2,
                    heart_rate: newData.heart_rate,
                  }
                : patient,
            ),
          );
        },
      )

      // saline
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "saline",
        },
        (payload) => {
          console.log("SALINE REALTIME:", payload);

          const newData = payload.new as {
            uwid: string;
            measure_value: number;
          };

          setPatients((current) =>
            current.map((patient) =>
              patient.uwid === newData.uwid
                ? {
                    ...patient,
                    saline_value: newData.measure_value,
                  }
                : patient,
            ),
          );
        },
      )

      // status
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patients_on_wards",
        },
        (payload) => {
          console.log("STATUS REALTIME:", payload);

          const newData = payload.new as {
            uwid: string;
            monitor_status: "normal" | "warning" | "critical";
            saline_status: "normal" | "low" | "empty";
          };

          setPatients((current) =>
            current.map((patient) =>
              patient.uwid === newData.uwid
                ? {
                    ...patient,
                    monitor_status: newData.monitor_status,
                    saline_status: newData.saline_status,
                  }
                : patient,
            ),
          );
        },
      )

      .subscribe((status) => {
        console.log("Dashboard Realtime:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    patients: filteredPatients,
    loading,
    error,
    refetch: loadPatients,
  };
}
