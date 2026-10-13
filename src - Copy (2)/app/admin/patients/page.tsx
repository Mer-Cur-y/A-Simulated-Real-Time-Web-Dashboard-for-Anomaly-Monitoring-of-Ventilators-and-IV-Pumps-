import AdminGuard from "@/components/admin/AdminGuard";
import PatientManagement from "@/components/admin/PatientManagement";

export default function AdminPatientsPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <PatientManagement />
        </div>
      </main>
    </AdminGuard>
  );
}