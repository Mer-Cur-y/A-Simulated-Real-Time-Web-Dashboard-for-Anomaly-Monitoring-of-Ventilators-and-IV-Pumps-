import { createClient } from "@/lib/supabase/client";
import type { PatientDashboard } from "@/types/patient";

export async function getPatients(
  wardId?: string,
  status?: string
): Promise<PatientDashboard[]> {
  const supabase = createClient();

  let query = supabase
    .from("patient_dashboard")
    .select("*")
    .order("severity_score", {
      ascending: false,
    })
    .order("active_alert_count", {
      ascending: false,
    })
    .order("last_name", {
      ascending: true,
    });

  // Filter by Ward
  if (wardId && wardId !== "all") {
    query = query.eq("ward_id", wardId);
  }

  // Filter by Status
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as PatientDashboard[];
}