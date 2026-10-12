import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type GlobalActivityAction =
  | "alert"
  | "system"
  | "user_action";

export type GlobalActivityStatus =
  | "active"
  | "acknowledged"
  | "resolved";

export interface GlobalActivity {
  act_id: string;
  action_type: GlobalActivityAction;
  description: string | null;
  status: GlobalActivityStatus;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  uid: string | null;
  uwid: string | null;
  staff_name: string;
  staff_role: string | null;
  patient_name: string | null;
  opd: string | null;
  ward_name: string | null;
  room_number: string | null;
  bed_number: string | null;
  acknowledged_by_name: string | null;
}

export async function getGlobalActivities(
  userId?: string,
): Promise<GlobalActivity[]> {
   let query = supabase
    .from("activity_log")
    .select(`
      act_id,
      action_type,
      description,
      status,
      created_at,
      acknowledged_at,
      acknowledged_by,
      uid,
      uwid
    `)
    .order("created_at", { ascending: false })
    .limit(300);

  if (userId) {
    query = query.eq("uid", userId);
  }

  const { data: logs, error } = await query;
  if (!logs?.length) return [];

  const userIds = [
    ...new Set(
      logs
        .flatMap((log) => [log.uid, log.acknowledged_by])
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const uwids = [
    ...new Set(
      logs
        .map((log) => log.uwid)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const [usersResult, admissionsResult] = await Promise.all([
    userIds.length
      ? supabase
          .from("users")
          .select("uid, first_name, last_name, role")
          .in("uid", userIds)
      : Promise.resolve({ data: [], error: null }),

    uwids.length
      ? supabase
          .from("patients_on_wards")
          .select("uwid, opd, wid, room_number, bed_number")
          .in("uwid", uwids)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (usersResult.error) throw new Error(usersResult.error.message);
  if (admissionsResult.error) throw new Error(admissionsResult.error.message);

  const admissions = admissionsResult.data ?? [];
  const opds = [...new Set(admissions.map((item) => item.opd))];
  const wids = [...new Set(admissions.map((item) => item.wid))];

  const [patientsResult, wardsResult] = await Promise.all([
    opds.length
      ? supabase
          .from("patients")
          .select("opd, first_name, last_name")
          .in("opd", opds)
      : Promise.resolve({ data: [], error: null }),

    wids.length
      ? supabase
          .from("wards")
          .select("wid, name")
          .in("wid", wids)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (patientsResult.error) throw new Error(patientsResult.error.message);
  if (wardsResult.error) throw new Error(wardsResult.error.message);

  const usersById = new Map(
    (usersResult.data ?? []).map((user) => [user.uid, user])
  );

  const admissionsById = new Map(
    admissions.map((item) => [item.uwid, item])
  );

  const patientsByOpd = new Map(
    (patientsResult.data ?? []).map((patient) => [patient.opd, patient])
  );

  const wardsById = new Map(
    (wardsResult.data ?? []).map((ward) => [ward.wid, ward])
  );

  return logs.map((log) => {
    const staff = log.uid ? usersById.get(log.uid) : null;
    const acknowledgedBy = log.acknowledged_by
      ? usersById.get(log.acknowledged_by)
      : null;

    const admission = log.uwid
      ? admissionsById.get(log.uwid)
      : null;

    const patient = admission
      ? patientsByOpd.get(admission.opd)
      : null;

    const ward = admission
      ? wardsById.get(admission.wid)
      : null;

    return {
      ...log,
      staff_name: staff
        ? `${staff.first_name} ${staff.last_name}`
        : log.uid
          ? "ไม่พบข้อมูลเจ้าหน้าที่"
          : "ระบบ",
      staff_role: staff?.role ?? null,
      patient_name: patient
        ? `${patient.first_name} ${patient.last_name}`
        : null,
      opd: admission?.opd ?? null,
      ward_name: ward?.name ?? null,
      room_number: admission?.room_number ?? null,
      bed_number: admission?.bed_number ?? null,
      acknowledged_by_name: acknowledgedBy
        ? `${acknowledgedBy.first_name} ${acknowledgedBy.last_name}`
        : null,
    };
  });
}