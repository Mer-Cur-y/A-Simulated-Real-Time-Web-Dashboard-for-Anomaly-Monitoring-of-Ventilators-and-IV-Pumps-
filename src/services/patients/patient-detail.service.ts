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
  patientId: string
): Promise<PatientDetailData> {
  const supabase = createClient();

  // -------------------------
  // Patient
  // -------------------------

  const { data: patientData, error: patientError } =
    await supabase
      .from("patients")
      .select(`
        id,
        first_name,
        last_name,
        ward_id,
        room_number,
        bed_number,
        status,
        wards (
          name
        )
      `)
      .eq("id", patientId)
      .single();

  if (patientError) {
    throw new Error(patientError.message);
  }

  const patient = {
    id: patientData.id,
    first_name: patientData.first_name,
    last_name: patientData.last_name,
    ward_id: patientData.ward_id,
    ward_name:
      patientData.wards?.name ?? "-",
    room_number: patientData.room_number,
    bed_number: patientData.bed_number,
    status: patientData.status,
  } as PatientDetail;

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
      .eq("patient_id", patientId)
      .order("device_type");

  if (devicesError) {
    throw new Error(devicesError.message);
  }

  const devices =
    (devicesData ?? []) as PatientDevice[];

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
      .from("saline_data")
      .select(`
        percentage,
        measured_at
      `)
      .eq("device_id", salineDevice.id)
      .order("measured_at", {
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
        tidals_volums,
        spo2,
        heart_rate,
        peak_pressure,
        leak,
        measured_at
      `)
      .eq("device_id", respiratoryDevice.id)
      .order("measured_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    respiratory =
      data as RespiratoryData | null;
  }

  // -------------------------
  // Alerts
  // -------------------------

  const { data: alertsData, error: alertsError } =
    await supabase
      .from("alerts")
      .select(`
        id,
        type,
        severity,
        title,
        message,
        value,
        threshold,
        status,
        created_at,
        acknowledged_at
      `)
      .eq("patient_id", patientId)
      .order("severity", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

  if (alertsError) {
    throw new Error(alertsError.message);
  }

  const alerts =
    (alertsData ?? []) as PatientAlert[];

  // -------------------------
  // Activity Logs
  // -------------------------

  const { data: activitiesData, error: activitiesError } =
    await supabase
      .from("activity_logs")
      .select(`
        id,
        action,
        description,
        created_at
      `)
      .eq("patient_id", patientId)
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

  if (activitiesError) {
    throw new Error(activitiesError.message);
  }

  const activities =
    (activitiesData ?? []) as ActivityLog[];

  return {
    patient,
    devices,
    saline,
    respiratory,
    alerts,
    activities,
  };
}