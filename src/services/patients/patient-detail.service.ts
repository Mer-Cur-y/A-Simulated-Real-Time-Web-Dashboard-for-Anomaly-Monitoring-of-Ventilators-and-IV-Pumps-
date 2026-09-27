import { createClient } from "@/lib/supabase/client";

import type {
  PatientDetailData,
  PatientDetail,
  PatientDevice,
  SalineData,
  RespiratoryData,
  PatientAlert,
  ActivityLog,
} from "@/types/patient-detail";



export async function getPatientDetail(
  uwid: string
): Promise<PatientDetailData | null> {
  const supabase = createClient();

  // -------------------------
  // Patient + Ward
  // -------------------------

  const { data: patientWardData, error: patientWardError } =
    await supabase
      .from("patients_on_wards")
      .select(`
        uwid,
        opd,
        room_number,
        bed_number,
        status,
        monitor_status,
        saline_status,

        patients!fk_patients_on_wards_patient (
          opd,
          first_name,
          last_name,
          gender,
          birthdate,
          phone,
          contact_person
        ),

        wards!fk_patients_on_wards_ward (
          wid,
          name
        )
      `)
      .eq("uwid", uwid)
      .single();

  if (patientWardError) {
    throw new Error(patientWardError.message);
  }

  if (!patientWardData) {
    return null;
  }

  const patientData = patientWardData.patients;
  const wardData = patientWardData.wards;

  if (!patientData || !wardData) {
    throw new Error("Patient or ward data not found");
  }

  const patient: PatientDetail = {
    id: patientData.opd,
    uwid: patientWardData.uwid,
    opd: patientData.opd,
    first_name: patientData.first_name,
    last_name: patientData.last_name,
    gender: patientData.gender,
    birthdate: patientData.birthdate,
    phone: patientData.phone,
    contact_person: patientData.contact_person,
    ward_name: wardData.name,
    room_number: patientWardData.room_number,
    bed_number: patientWardData.bed_number,
    status: patientWardData.status,
    monitor_status: patientWardData.monitor_status,
    saline_status: patientWardData.saline_status,
  };

  // -------------------------
  // Devices
  // -------------------------

  const { data: devicesData, error: devicesError } =
    await supabase
      .from("devices")
      .select(`
        id,
        device_uid,
        device_type,
        status,
        installed_at,
        last_seen
      `)
      .eq("uwid", uwid)
      .order("device_type");

  if (devicesError) {
    throw new Error(devicesError.message);
  }

  const devices = (devicesData ?? []) as PatientDevice[];

  // -------------------------
  // Saline
  // -------------------------

  const salineDevice = devices.find(
    (device) =>
      device.device_type === "saline" ||
      device.device_type === "multi_sensor"
  );

  let saline: SalineData | null = null;

  if (salineDevice) {
    const { data, error } = await supabase
      .from("saline")
      .select(`
        device_id,
        measure_value,
        measure_at
      `)
      .eq("uwid", uwid)
      .eq("device_id", salineDevice.device_uid)
      .order("measure_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    saline = data as SalineData | null;
  }

  // -------------------------
  // Respiratory
  // -------------------------

  const respiratoryDevice = devices.find(
    (device) =>
      device.device_type === "respiratory" ||
      device.device_type === "multi_sensor"
  );

  let respiratory: RespiratoryData | null = null;

  if (respiratoryDevice) {
    const { data, error } = await supabase
      .from("respiratory_data")
      .select(`
        device_id,
        spo2,
        heart_rate,
        measure_at
      `)
      .eq("uwid", uwid)
      .eq("device_id", respiratoryDevice.device_uid)
      .order("measure_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    respiratory = data as RespiratoryData | null;
  }

  // -------------------------
  // Alerts
  // -------------------------

  const { data: alertsData, error: alertsError } =
    await supabase
      .from("alerts")
      .select(`
        alert_id,
        aid,
        uwid,
        device_id,
        severity,
        value,
        status,
        created_at,
        acknowledged_at,
        acknowledged_by,
        resolved_at
      `)
      .eq("uwid", uwid)
      .order("created_at", {
        ascending: false,
      });

  if (alertsError) {
    throw new Error(alertsError.message);
  }

  const alerts = (alertsData ?? []) as PatientAlert[];

  // -------------------------
  // Activity Logs
  // -------------------------

  const { data: activitiesData, error: activitiesError } =
    await supabase
      .from("activity_log")
      .select(`
        act_id,
        uwid,
        uid,
        action_type,
        description,
        status,
        created_at
      `)
      .eq("uwid", uwid)
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

  if (activitiesError) {
    throw new Error(activitiesError.message);
  }

  const activities = (activitiesData ?? []) as ActivityLog[];

  return {
    patient,
    devices,
    saline,
    respiratory,
    alerts,
    activities,
  };
}