export type PatientStatus =
  | "normal"
  | "warning"
  | "critical";

export interface PatientDashboard {
  patient_id: string;

  first_name: string;
  last_name: string;

  ward_id: string;
  ward_name: string;

  room_number: string | null;
  bed_number: string | null;

  status: PatientStatus;

  severity_score: number;
  active_alert_count: number;

  saline_percentage: number | null;

  spo2: number | null;
  heart_rate: number | null;
  peak_pressure: number | null;
}