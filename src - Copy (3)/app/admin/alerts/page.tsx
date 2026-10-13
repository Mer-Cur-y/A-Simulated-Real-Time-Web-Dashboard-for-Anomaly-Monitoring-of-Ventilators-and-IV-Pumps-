import AdminGuard from "@/components/admin/AdminGuard";
import AlertHistoryManagement from "@/components/admin/AlertHistoryManagement";

export default function AdminAlertsPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <AlertHistoryManagement />
        </div>
      </main>
    </AdminGuard>
  );
}