import AdminGuard from "@/components/admin/AdminGuard";
import DeviceManagement from "@/components/devices/DeviceManagement";

export default function AdminDevicesPage() {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-6">
            
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">อุปกรณ์และการจับคู่ผู้ป่วย</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">ลงทะเบียนอุปกรณ์ ตรวจสอบสถานะการเชื่อมต่อ และจับคู่กับผู้ป่วยที่ถูกต้อง</p>
          </header>
          <DeviceManagement />
        </div>
      </main>
    </AdminGuard>
  );
}
