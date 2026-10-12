export interface RespiratoryData {
  uwid: string;

  device_id: string;

  spo2: number | null;

  heart_rate: number | null;

  measure_at: string;
}

export interface SalineData {
  uwid: string;

  device_id: string;

  measure_value: number;

  measure_at: string;
}