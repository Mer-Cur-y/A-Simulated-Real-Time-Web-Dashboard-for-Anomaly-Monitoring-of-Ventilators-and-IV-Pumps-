import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface StaffMember {
  uid: string;
  first_name: string;
  last_name: string;
  role: "admin" | "doctor" | "nurse" | "staff";
}

export interface WardOption {
  wid: string;
  name: string;
  building_no: string | null;
  floor_no: number | null;
}

export interface StaffWardAssignment {
  id: string;
  uid: string;
  wid: string;
  assigned_by: string | null;
  assigned_at: string;
  staff: StaffMember;
  ward: WardOption;
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from("users")
    .select("uid, first_name, last_name, role")
    .in("role", ["doctor", "nurse", "staff"])
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getWardOptions(): Promise<WardOption[]> {
  const { data, error } = await supabase
    .from("wards")
    .select("wid, name, building_no, floor_no")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getStaffWardAssignments(): Promise<
  StaffWardAssignment[]
> {
  const { data, error } = await supabase
    .from("staff_wards")
    .select(`
      id,
      uid,
      wid,
      assigned_by,
      assigned_at,
      staff:users!staff_wards_uid_fkey (
        uid,
        first_name,
        last_name,
        role
      ),
      ward:wards!staff_wards_wid_fkey (
        wid,
        name,
        building_no,
        floor_no
      )
    `)
    .order("assigned_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((item: any) => ({
    ...item,
    staff: Array.isArray(item.staff) ? item.staff[0] : item.staff,
    ward: Array.isArray(item.ward) ? item.ward[0] : item.ward,
  }));
}

export async function assignStaffToWard(
  uid: string,
  wid: string
): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("กรุณาเข้าสู่ระบบใหม่");
  }

  const { error } = await supabase
    .from("staff_wards")
    .insert({
      uid,
      wid,
      assigned_by: user.id,
    });

  if (error) {
    if (error.code === "23505") {
      throw new Error("เจ้าหน้าที่ได้รับมอบหมายวอร์ดนี้แล้ว");
    }
    throw new Error(error.message);
  }
}

export async function removeStaffFromWard(id: string): Promise<void> {
  const { error } = await supabase
    .from("staff_wards")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}