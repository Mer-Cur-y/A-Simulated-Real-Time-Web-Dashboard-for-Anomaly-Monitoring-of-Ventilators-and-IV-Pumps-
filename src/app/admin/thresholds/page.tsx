import AdminGuard from "@/components/admin/AdminGuard";
import ThresholdManagement from "@/components/devices/ThresholdManagement";

export default function AdminThresholdsPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <ThresholdManagement />
        </div>
      </main>
    </AdminGuard>
  );
}