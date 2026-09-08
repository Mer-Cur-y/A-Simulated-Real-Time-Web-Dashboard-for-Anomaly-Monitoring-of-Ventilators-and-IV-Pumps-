import { createClient } from "@/lib/supabase/client";

export async function getWards() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("wards")
    .select(`
      id,
      name,
      description
    `)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}