
import MedicalStaffGuard from "@/components/auth/MedicalStaffGuard";
import AlertHistoryManagement from "@/components/admin/AlertHistoryManagement";

export default function StaffAlertsPage() {
  return (
    <MedicalStaffGuard>
      <main className="min-h-screen bg-base-200 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <AlertHistoryManagement />
        </div>
      </main>
    </MedicalStaffGuard>
  );
}
