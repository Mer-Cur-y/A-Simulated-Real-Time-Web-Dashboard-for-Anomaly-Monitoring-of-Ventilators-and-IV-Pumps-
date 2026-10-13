import type { ActivityLog } from "@/types/patient-detail";

interface Props {
  activities: ActivityLog[];
}

export default function ActivityList({
  activities,
}: Props) {
  return (
    <div className="card bg-base-100 shadow-sm border">
      <div className="card-body">

        <h2 className="card-title">
          Activity Logs
        </h2>

        {activities.length === 0 ? (
          <p className="opacity-60">
            ไม่มี Activity
          </p>
        ) : (
          <div className="space-y-3">

            {activities.map((activity) => (
              <div
                key={activity.id}
                className="border-b pb-3"
              >

                <div className="font-semibold">
                  {activity.action}
                </div>

                <div className="text-sm">
                  {activity.description ?? "-"}
                </div>

                <div className="text-sm opacity-60">
                  {new Date(
                    activity.created_at
                  ).toLocaleString()}
                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}