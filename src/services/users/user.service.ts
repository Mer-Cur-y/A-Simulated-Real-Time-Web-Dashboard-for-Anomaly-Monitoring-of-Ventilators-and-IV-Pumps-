import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type UserRole = "admin" | "doctor" | "nurse" | "staff";

export interface SystemUser {
  uid: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  created_at: string;
}

export async function getUsers(): Promise<SystemUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select(`
      uid,
      first_name,
      last_name,
      role,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function updateUserRole(
  uid: string,
  role: UserRole,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("uid", uid);

  if (error) {
    throw new Error(error.message);
  }
}
export async function createManagedUser(input: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: Exclude<UserRole, "admin">;
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke(
    "admin-create-user",
    {
      body: input,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error(
      data?.error ?? "ไม่สามารถสร้างบัญชีผู้ใช้ได้",
    );
  }
}