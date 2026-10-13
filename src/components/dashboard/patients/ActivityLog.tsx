"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createActivityNote,
  getPatientActivities,
  type ActivityLog as ActivityLogType,
} from "@/services/activity/activity.service";

interface Props {
  uwid: string;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function getActionLabel(
  action: ActivityLogType["action_type"]
) {
  switch (action) {
    case "alert":
      return "Alert";

    case "user_action":
      return "บันทึกข้อความ";

    case "system":
      return "ระบบ";

    default:
      return action;
  }
}

function getStatusLabel(
  status: ActivityLogType["status"]
) {
  if (!status) return "";
  switch (status) {
    case "active":
      return "Active";

    case "acknowledged":
      return "Acknowledged";

    case "resolved":
      return "Resolved";

    default:
      return status;
  }
}

export default function ActivityLog({ uwid }: Props) {
  const [activities, setActivities] = useState<
    ActivityLogType[]
  >([]);

  const [loading, setLoading] = useState(true);

  // ================================
  // เพิ่ม State สำหรับสร้าง Note
  // ================================

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(
    null
  );

  // ================================
  // โหลด Activity + Realtime
  // ================================

  useEffect(() => {
    let mounted = true;

    async function loadActivities() {
      try {
        const data = await getPatientActivities(uwid);

        if (mounted) {
          setActivities(data);
        }
      } catch (error) {
        console.error(
          "Failed to load activity log:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    const supabase = createClient();

    const channel = supabase
      .channel(
        `patient-activity-${uwid}-${crypto.randomUUID()}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_log",
          filter: `uwid=eq.${uwid}`,
        },
        async () => {
          if (!mounted) return;

          const data =
            await getPatientActivities(uwid);

          if (mounted) {
            setActivities(data);
          }
        }
      )
      .subscribe((status) => {
        console.log(
          "Activity Realtime:",
          status
        );
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [uwid]);

  // ================================
  // สร้าง Activity Note
  // ================================

  async function handleAddNote() {
    if (!note.trim()) {
      setSaveError("กรุณาระบุรายละเอียด");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      await createActivityNote(
        uwid,
        note.trim()
      );

      // ล้างช่องกรอกหลังบันทึกสำเร็จ
      setNote("");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "ไม่สามารถบันทึก Activity ได้"
      );
    } finally {
      setSaving(false);
    }
  }

  // ================================
  // Loading
  // ================================

  if (loading) {
    return (
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold">
          ประวัติการดูแลผู้ป่วย
        </h2>

        <p className="mt-2 text-sm text-base-content/60">
          กำลังโหลดประวัติ...
        </p>
      </section>
    );
  }

  // ================================
  // UI
  // ================================

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold">
          ประวัติการดูแลผู้ป่วย
        </h2>

        
      </div>

      {/* ================================
          Add Activity Note
      ================================= */}

      <div className="mb-6 rounded-xl bg-base-200 p-4">
        <h3 className="font-semibold">
          บันทึกการดูแลผู้ป่วย
        </h3>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="เช่น ตรวจวัดสัญญาณชีพ เปลี่ยนน้ำเกลือ หรือรายละเอียดการดูแล..."
          className="textarea textarea-bordered mt-3 w-full"
          rows={3}
        />

        {saveError && (
          <p className="mt-2 text-sm text-error">
            {saveError}
          </p>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={saving || !note.trim()}
            onClick={handleAddNote}
          >
            {saving
              ? "กำลังบันทึก..."
              : "บันทึก"}
          </button>
        </div>
      </div>

      {/* ================================
          Activity List
      ================================= */}

      {activities.length === 0 ? (
        <div className="rounded-xl bg-base-200 p-5 text-center">
          <p className="text-sm text-base-content/60">
            ยังไม่มีประวัติการดำเนินการ
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.act_id}
              className="flex gap-3"
            >
              <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-primary" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {getActionLabel(
                      activity.action_type
                    )}
                  </p>

                  <span className="text-xs text-base-content/50">
                    {formatTime(
                      activity.created_at
                    )}
                  </span>
                </div>

                {activity.description && (
                  <p className="mt-1 text-sm text-base-content/70">
                    {activity.description}
                  </p>
                )}

                {activity.action_type !== "user_action" && activity.status && (
                  <div className="mt-2">
                    <span className="badge badge-sm badge-ghost">
                      {getStatusLabel(activity.status)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}