import { createClient } from "@/lib/supabase/client";
import type { PatientDashboard } from "@/types/patient";
const supabase = createClient();
export async function getPatients(): Promise<PatientDashboard[]> {
  const { data, error } = await supabase
    .from("patient_dashboard")
    .select("*")
    .order("last_name", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
export async function getPatientByUwid(
  uwid: string,
): Promise<PatientDashboard | null> {
  const { data, error } = await supabase
    .from("patient_dashboard")
    .select("*")
    .eq("uwid", uwid)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
