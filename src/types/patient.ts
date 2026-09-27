  
export type MonitorStatus =
  | "normal"
  | "warning"
  | "critical";

export type SalineStatus =
  | "normal"
  | "low"
  | "empty";

export type WardStatus =
  | "onward"
  | "discharged"
  | "transferred";

export interface PatientDashboard {
  uwid: string;

  opd: string;

  first_name: string;
  last_name: string;

  gender: string | null;
  birthdate: string | null;

  ward_id: string;
  ward_name: string;

  room_number: string | null;
  bed_number: string | null;

  ward_status: WardStatus;

  monitor_status: MonitorStatus;
  saline_status: SalineStatus;

  saline_value: number | null;

  spo2: number | null;
  heart_rate: number | null;
}