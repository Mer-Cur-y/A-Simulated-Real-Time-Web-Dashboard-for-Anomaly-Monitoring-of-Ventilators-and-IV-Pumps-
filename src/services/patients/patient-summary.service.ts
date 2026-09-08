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

  let query = supabase
    .from("patient_dashboard")
    .select("status");

  if (wardId && wardId !== "all") {
    query = query.eq("ward_id", wardId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const summary: PatientSummary = {
    normal: 0,
    warning: 0,
    critical: 0,
  };

  for (const patient of data ?? []) {

    if (patient.status === "normal") {
      summary.normal++;
    }

    if (patient.status === "warning") {
      summary.warning++;
    }

    if (patient.status === "critical") {
      summary.critical++;
    }
  }

  return summary;
}