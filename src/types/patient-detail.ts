export interface PatientDetail {
  id: string;
  first_name: string;
  last_name: string;

  ward_id: string;
  ward_name: string;

  room_number: string | null;
  bed_number: string | null;

  status: "normal" | "warning" | "critical";
}

export interface PatientDevice {
  id: string;
  device_uid: string;
  device_type: "saline" | "respiratory" | "multi_sensor";
  status: "online" | "offline" | "maintenance";
  installed_at: string | null;
  last_seen: string | null;
}

export interface SalineData {
  percentage: number;
  measured_at: string;
}

export interface RespiratoryData {
  tidals_volums: number | null;
  spo2: number | null;
  heart_rate: number | null;
  peak_pressure: number | null;
  leak: number | null;
  measured_at: string;
}

export interface PatientAlert {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string | null;
  value: number | null;
  threshold: number | null;
  status: "active" | "acknowledged" | "resolved";
  created_at: string;
  acknowledged_at: string | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface PatientDetailData {
  patient: PatientDetail;
  devices: PatientDevice[];
  saline: SalineData | null;
  respiratory: RespiratoryData | null;
  alerts: PatientAlert[];
  activities: ActivityLog[];
}