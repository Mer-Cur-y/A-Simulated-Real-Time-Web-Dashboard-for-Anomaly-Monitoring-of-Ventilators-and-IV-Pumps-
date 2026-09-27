import { createClient } from "@/lib/supabase/client";
import type { Ward } from "@/types/ward";
const supabase = createClient();
export async function getWards(): Promise<Ward[]> {
  const { data, error } = await supabase
    .from("wards")
    .select("*")
    .order("name", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
