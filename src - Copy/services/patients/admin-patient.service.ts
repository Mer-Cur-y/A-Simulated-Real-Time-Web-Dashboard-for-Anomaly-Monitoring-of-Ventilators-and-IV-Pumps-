import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface AdminWardOption {
  wid: string;
  name: string;
}

export interface CurrentPatientAdmission {
  uwid: string;
  opd: string;
  wid: string;
  uid: string | null;
  room_number: string | null;
  bed_number: string | null;
  assigned_at: string;
  first_name: string;
  last_name: string;
  ward_name: string;
  staff_name: string | null;
}

export interface RegisterPatientInput {
  opd: string;
  first_name: string;
  last_name: string;
  wid: string;
  gender: string;
  birthdate: string;
  thai_id: string;
  address: string;
  phone: string;
  contact_person: string;
  uid: string;
  room_number: string;
  bed_number: string;
}

export async function getAdminWardOptions(): Promise<AdminWardOption[]> {
  const { data, error } = await supabase
    .from("wards")
    .select("wid, name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCurrentPatientAdmissions(): Promise<
  CurrentPatientAdmission[]
> {
  const { data: admissions, error } = await supabase
    .from("patients_on_wards")
    .select(
      "uwid, opd, wid, uid, room_number, bed_number, assigned_at"
    )
    .eq("status", "onward")
    .order("assigned_at", { ascending: false });

  if (error) throw new Error(error.message);

  if (!admissions?.length) return [];

  const opds = [...new Set(admissions.map((item) => item.opd))];
  const wids = [...new Set(admissions.map((item) => item.wid))];
  const uids = [
    ...new Set(
      admissions
        .map((item) => item.uid)
        .filter((uid): uid is string => Boolean(uid))
    ),
  ];

  const [patientsResult, wardsResult, usersResult] = await Promise.all([
    supabase
      .from("patients")
      .select("opd, first_name, last_name")
      .in("opd", opds),
    supabase
      .from("wards")
      .select("wid, name")
      .in("wid", wids),
    uids.length
      ? supabase
          .from("users")
          .select("uid, first_name, last_name")
          .in("uid", uids)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (patientsResult.error) throw new Error(patientsResult.error.message);
  if (wardsResult.error) throw new Error(wardsResult.error.message);
  if (usersResult.error) throw new Error(usersResult.error.message);

  const patientsByOpd = new Map(
    (patientsResult.data ?? []).map((patient) => [patient.opd, patient])
  );
  const wardsById = new Map(
    (wardsResult.data ?? []).map((ward) => [ward.wid, ward])
  );
  const usersById = new Map(
    (usersResult.data ?? []).map((user) => [user.uid, user])
  );

  return admissions.map((item) => {
    const patient = patientsByOpd.get(item.opd);
    const ward = wardsById.get(item.wid);
    const user = item.uid ? usersById.get(item.uid) : null;

    return {
      ...item,
      first_name: patient?.first_name ?? "ไม่พบข้อมูล",
      last_name: patient?.last_name ?? "",
      ward_name: ward?.name ?? "ไม่พบวอร์ด",
      staff_name: user
        ? `${user.first_name} ${user.last_name}`
        : null,
    };
  });
}

export async function registerPatient(
  input: RegisterPatientInput
): Promise<string> {
  const { data, error } = await supabase.rpc("admin_register_patient", {
    p_opd: input.opd.trim(),
    p_first_name: input.first_name.trim(),
    p_last_name: input.last_name.trim(),
    p_wid: input.wid,
    p_gender: input.gender || null,
    p_birthdate: input.birthdate || null,
    p_thai_id: input.thai_id.trim() || null,
    p_address: input.address.trim() || null,
    p_phone: input.phone.trim() || null,
    p_contact_person: input.contact_person.trim() || null,
    p_uid: input.uid || null,
    p_room_number: input.room_number.trim() || null,
    p_bed_number: input.bed_number.trim() || null,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

export async function dischargePatient(uwid: string): Promise<void> {
  const { error } = await supabase.rpc("admin_discharge_patient", {
    p_uwid: uwid,
  });

  if (error) throw new Error(error.message);
}