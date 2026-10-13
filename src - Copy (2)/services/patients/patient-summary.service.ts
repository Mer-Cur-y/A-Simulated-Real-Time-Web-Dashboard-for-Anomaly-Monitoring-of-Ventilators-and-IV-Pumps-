import { createClient } from "@/lib/supabase/client";

export interface PatientSummary {
  normal: number;
  warning: number;
  critical: number;
}

export async function getPatientSummary(
  wardId?: string
): Promise<PatientSummary> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "get_patient_summary",
    {
      
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  const row = data?.[0];

  return {
    normal: Number(row?.normal ?? 0),
    warning: Number(row?.warning ?? 0),
    critical: Number(row?.critical ?? 0),
  };
}