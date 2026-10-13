import AdminGuard from "@/components/admin/AdminGuard";
import StaffWardAssignment from "@/components/admin/StaffWardAssignment";

export default function StaffWardsPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-base-200 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-[1440px]">
          <StaffWardAssignment />
        </div>
      </main>
    </AdminGuard>
  );
}