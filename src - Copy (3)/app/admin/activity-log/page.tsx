import AdminGuard from "@/components/admin/AdminGuard";
import GlobalActivityLog from "@/components/admin/GlobalActivityLog";

export default function AdminActivityLogPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <GlobalActivityLog />
        </div>
      </main>
    </AdminGuard>
  );
}