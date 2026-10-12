import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "active" | "acknowledged" | "resolved";

export interface AlertHistoryItem {
  alert_id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  value: number | null;
  device_id: string | null;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  alert_type: string;
  alert_message: string | null;
  uwid: string;
  opd: string | null;
  patient_name: string;
  ward_name: string;
  room_number: string | null;
  bed_number: string | null;
}

export async function getAlertHistory(): Promise<AlertHistoryItem[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select(`
      alert_id,
      severity,
      status,
      value,
      device_id,
      created_at,
      acknowledged_at,
      acknowledged_by,
      resolved_at,
      uwid,
      alert_type:alert_types!fk_alert_type (
        alert_type,
        alert_message
      ),
      admission:patients_on_wards!fk_alert_patient_ward (
        opd,
        room_number,
        bed_number,
        patient:patients!fk_patients_on_wards_patient (
          first_name,
          last_name
        ),
        ward:wards!fk_patients_on_wards_ward (
          name
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const alertType = Array.isArray(row.alert_type)
      ? row.alert_type[0]
      : row.alert_type;

    const admission = Array.isArray(row.admission)
      ? row.admission[0]
      : row.admission;

    const patient = Array.isArray(admission?.patient)
      ? admission.patient[0]
      : admission?.patient;

    const ward = Array.isArray(admission?.ward)
      ? admission.ward[0]
      : admission?.ward;

    return {
      alert_id: row.alert_id,
      severity: row.severity,
      status: row.status,
      value: row.value == null ? null : Number(row.value),
      device_id: row.device_id,
      created_at: row.created_at,
      acknowledged_at: row.acknowledged_at,
      acknowledged_by: row.acknowledged_by,
      resolved_at: row.resolved_at,
      uwid: row.uwid,
      alert_type: alertType?.alert_type ?? "unknown",
      alert_message: alertType?.alert_message ?? null,
      opd: admission?.opd ?? null,
      patient_name: patient
        ? `${patient.first_name} ${patient.last_name}`
        : "ไม่พบข้อมูลผู้ป่วย",
      ward_name: ward?.name ?? "ไม่พบข้อมูลวอร์ด",
      room_number: admission?.room_number ?? null,
      bed_number: admission?.bed_number ?? null,
    } satisfies AlertHistoryItem;
  });
}