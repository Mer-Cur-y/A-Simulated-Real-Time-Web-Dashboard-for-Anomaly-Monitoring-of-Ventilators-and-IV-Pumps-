import AdminGuard from "@/components/admin/AdminGuard";
import UserManagement from "@/components/admin/UserManagement";

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <UserManagement />
        </div>
      </main>
    </AdminGuard>
  );
}