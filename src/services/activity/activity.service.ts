import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface ActivityLog {
  act_id: string;
  action_type: "alert" | "system" | "user_action";
  description: string | null;
  status: "active" | "acknowledged" | "resolved";
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  uwid: string | null;
  uid: string | null;
}

export async function getPatientActivities(
  uwid: string,
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select(`
      act_id,
      action_type,
      description,
      status,
      created_at,
      acknowledged_at,
      acknowledged_by,
      uwid,
      uid
    `)
    .eq("uwid", uwid)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createActivityNote(
  uwid: string,
  description: string,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    "create_activity_note",
    {
      p_uwid: uwid,
      p_description: description,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}