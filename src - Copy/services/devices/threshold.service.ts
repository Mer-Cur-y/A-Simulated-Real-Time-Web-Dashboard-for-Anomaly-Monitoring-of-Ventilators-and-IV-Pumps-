import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface SensorThreshold {
  id: string;
  sensor_type: string;
  metric: string;
  warning_min: number | null;
  warning_max: number | null;
  critical_min: number | null;
  critical_max: number | null;
  enabled: boolean;
  created_at: string;
}

export async function getSensorThresholds(): Promise<SensorThreshold[]> {
  const { data, error } = await supabase
    .from("sensor_thresholds")
    .select("*")
    .order("sensor_type", { ascending: true })
    .order("metric", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function updateSensorThreshold(
  id: string,
  values: {
    warning_min: number | null;
    warning_max: number | null;
    critical_min: number | null;
    critical_max: number | null;
    enabled: boolean;
  }
): Promise<void> {
  const { error } = await supabase
    .from("sensor_thresholds")
    .update(values)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}