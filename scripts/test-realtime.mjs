import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

const UWID = "a1000000-0000-4000-8000-000000000002";

const RESP_DEVICE = "TEST-RESP-RT-001";
const SALINE_DEVICE = "TEST-SALINE-RT-001";

if (!URL || !KEY || !EMAIL || !PASSWORD) {
  throw new Error(
    "กรุณาตรวจสอบ URL, Publishable/Anon Key, " +
      "TEST_USER_EMAIL และ TEST_USER_PASSWORD ใน .env.local",
  );
}

const supabase = createClient(URL, KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scenarios = [
  { name: "NORMAL", spo2: 98, heartRate: 82, saline: 30 },
  { name: "WARNING", spo2: 92, heartRate: 105, saline: 15 },
  { name: "CRITICAL", spo2: 88, heartRate: 125, saline: 5 },
  { name: "RECOVERY", spo2: 97, heartRate: 85, saline: 28 },
];

async function main() {
  // 1. Login ด้วยบัญชี Admin
  const { data: auth, error: authError } =
    await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });

  if (authError) {
    throw new Error(`LOGIN FAILED: ${authError.message}`);
  }

  console.log("LOGIN OK:", auth.user.email);
  console.log("TEST UWID:", UWID);
  const { data: authUser } = await supabase.auth.getUser();

  console.log("AUTH UID:", authUser.user?.id);

  const { data: admissions, error: admissionError } = await supabase
    .from("patients_on_wards")
    .select("uwid, opd, wid, status")
    .eq("uwid", UWID);

  console.log("ADMISSION QUERY:", admissions);
  console.log("ADMISSION ERROR:", admissionError);

  // 2. ตรวจสอบว่าอ่าน Admission ทดสอบได้
  const { data: patient, error: patientError } = await supabase
    .from("patients_on_wards")
    .select("uwid, opd, monitor_status, saline_status")
    .eq("uwid", UWID)
    .maybeSingle();

  if (patientError) {
    throw new Error(`READ PATIENT FAILED: ${patientError.message}`);
  }

  if (!patient) {
    throw new Error("ไม่พบ Admission ทดสอบ กรุณารัน SQL ขั้นที่ 1 ก่อน");
  }

  console.log("DATABASE READ OK:", patient);

  // 3. Subscribe ก่อน Insert เพื่อรอฟัง Realtime
  const channel = supabase
    .channel(`test-realtime-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "respiratory_data",
        filter: `uwid=eq.${UWID}`,
      },
      (payload) => {
        console.log("[REALTIME respiratory_data]", payload.eventType);
        console.log(payload.new);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "saline",
        filter: `uwid=eq.${UWID}`,
      },
      (payload) => {
        console.log("[REALTIME saline]", payload.eventType);
        console.log(payload.new);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "patients_on_wards",
        filter: `uwid=eq.${UWID}`,
      },
      (payload) => {
        console.log("[REALTIME patient status]", payload.eventType);
        console.log(payload.new);
      },
    );

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Realtime subscribe timeout"));
    }, 15000);

    channel.subscribe((status, error) => {
      console.log("[CHANNEL]", status);

      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        resolve();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timeout);
        reject(error ?? new Error(status));
      }
    });
  });

  console.log("REALTIME READY");

  // 4. Insert ข้อมูลใหม่ทุก 5 วินาที
  let index = 0;

  try {
    while (true) {
      const s = scenarios[index % scenarios.length];
      const timestamp = new Date().toISOString();

      console.log(`\n--- TEST ${s.name} ---`);

      const respiratoryRow = {
        uwid: UWID,
        device_id: RESP_DEVICE,
        spo2: s.spo2,
        heart_rate: s.heartRate,
        measure_at: timestamp,
      };

      const salineRow = {
        uwid: UWID,
        device_id: SALINE_DEVICE,
        measure_value: s.saline,
        measure_at: timestamp,
      };

      // Insert Respiratory
      const { error: respiratoryError } = await supabase
        .from("respiratory_data")
        .insert(respiratoryRow);

      if (respiratoryError) {
        console.error("[RESPIRATORY INSERT FAILED]", respiratoryError.message);
      } else {
        console.log("[RESPIRATORY INSERT OK]", respiratoryRow);
      }

      // Insert Saline
      const { error: salineError } = await supabase
        .from("saline")
        .insert(salineRow);

      if (salineError) {
        console.error("[SALINE INSERT FAILED]", salineError.message);
      } else {
        console.log("[SALINE INSERT OK]", salineRow);
      }

      // อ่านสถานะล่าสุดจาก Database
      const { data: latest, error: latestError } = await supabase
        .from("patients_on_wards")
        .select("monitor_status, saline_status")
        .eq("uwid", UWID)
        .maybeSingle();

      if (latestError) {
        console.error("[STATUS READ FAILED]", latestError.message);
      } else {
        console.log("[DATABASE STATUS]", latest);
      }

      index++;
      await sleep(1000);
    }
  } finally {
    await supabase.removeChannel(channel);
    await supabase.auth.signOut();
  }
}

main().catch((error) => {
  console.error("[TEST FAILED]", error.message);
  process.exitCode = 1;
});
