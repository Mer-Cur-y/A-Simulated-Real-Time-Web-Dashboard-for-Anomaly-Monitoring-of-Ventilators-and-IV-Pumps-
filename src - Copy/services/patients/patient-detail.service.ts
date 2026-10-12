import { createClient } from "@/lib/supabase/client";

export interface PatientDetailData {
  patient: {
    uwid: string;
    opd: string;
    first_name: string;
    last_name: string;
    gender: string | null;
    birthdate: string | null;
    room_number: string | null;
    bed_number: string | null;
    ward_name: string;
    monitor_status: string;
    saline_status: string;
  };

  respiratory: {
    spo2: number | null;
    heart_rate: number | null;
    measure_at: string;
  } | null;

  saline: {
    measure_value: number;
    measure_at: string;
  } | null;

  devices: {
    id: string;
    device_uid: string;
    device_type: string;
    status: string;
    last_seen: string | null;
  }[];

  alerts: {
    alert_id: string;
    severity: string;
    value: number | null;
    status: string;
    created_at: string;
  }[];

  activities: {
    act_id: string;
    action_type: string;
    description: string | null;
    status: string;
    created_at: string;
  }[];
}

export async function getPatientDetail(
  uwid: string,
): Promise<PatientDetailData | null> {
  const supabase = createClient();

  // -----------------------------
  // Patient + Ward
  // -----------------------------
  const { data: patientWard, error: patientError } = await supabase
    .from("patients_on_wards")
    .select(
      `
      uwid,
      opd,
      room_number,
      bed_number,
      monitor_status,
      saline_status,
      patients!fk_patients_on_wards_patient (
        opd,
        first_name,
        last_name,
        gender,
        birthdate
      ),
      wards!fk_patients_on_wards_ward (
        name
      )
    `,
    )
    .eq("uwid", uwid)
    .single();

  if (patientError) {
    throw new Error(patientError.message);
  }

  if (!patientWard) {
    return null;
  }

  // -----------------------------
  // Latest Respiratory
  // -----------------------------
  const { data: respiratory, error: respiratoryError } = await supabase
    .from("respiratory_data")
    .select(
      `
        spo2,
        heart_rate,
        measure_at
      `,
    )
    .eq("uwid", uwid)
    .order("measure_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (respiratoryError) {
    throw new Error(respiratoryError.message);
  }

  // -----------------------------
  // Latest Saline
  // -----------------------------
  const { data: saline, error: salineError } = await supabase
    .from("saline")
    .select(
      `
      measure_value,
      measure_at
    `,
    )
    .eq("uwid", uwid)
    .order("measure_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (salineError) {
    throw new Error(salineError.message);
  }

  // -----------------------------
  // Devices
  // -----------------------------
  const { data: devices, error: devicesError } = await supabase
    .from("devices")
    .select(
      `
      id,
      device_uid,
      device_type,
      status,
      last_seen
    `,
    )
    .eq("uwid", uwid)
    .order("device_type", { ascending: true });

  if (devicesError) {
    throw new Error(devicesError.message);
  }

  // -----------------------------
  // Alerts
  // -----------------------------
  const { data: alerts, error: alertsError } = await supabase
    .from("alerts")
    .select(
      `
      alert_id,
      severity,
      value,
      status,
      created_at
    `,
    )
    .eq("uwid", uwid)
    .order("created_at", { ascending: false })
    .limit(20);

  if (alertsError) {
    throw new Error(alertsError.message);
  }

  // -----------------------------
  // Activity Log
  // -----------------------------
  const { data: activities, error: activitiesError } = await supabase
    .from("activity_log")
    .select(
      `
        act_id,
        action_type,
        description,
        status,
        created_at
      `,
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (activitiesError) {
    throw new Error(activitiesError.message);
  }

  const patient = patientWard.patients as unknown as {
    opd: string;
    first_name: string;
    last_name: string;
    gender: string | null;
    birthdate: string | null;
  };

  const ward = patientWard.wards as unknown as {
    name: string;
  };

  return {
    patient: {
      uwid: patientWard.uwid,
      opd: patient.opd,
      first_name: patient.first_name,
      last_name: patient.last_name,
      gender: patient.gender,
      birthdate: patient.birthdate,
      room_number: patientWard.room_number,
      bed_number: patientWard.bed_number,
      ward_name: ward.name,
      monitor_status: patientWard.monitor_status,
      saline_status: patientWard.saline_status,
    },

    respiratory,

    saline,

    devices: devices ?? [],

    alerts: alerts ?? [],

    activities: activities ?? [],
  };
}

export async function getRespiratoryHistory(
  uwid: string,
  hours: number = 1,
): Promise<
  {
    spo2: number | null;
    heart_rate: number | null;
    measure_at: string;
  }[]
> {
  const supabase = createClient();

  const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("respiratory_data")
    .select(
      `
      spo2,
      heart_rate,
      measure_at
    `,
    )
    .eq("uwid", uwid)
    .gte("measure_at", from)
    .order("measure_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
