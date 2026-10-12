import AdminGuard from "@/components/admin/AdminGuard";
import StaffWardAssignment from "@/components/admin/StaffWardAssignment";

export default function StaffWardsPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <StaffWardAssignment />
        </div>
      </main>
    </AdminGuard>
  );
}