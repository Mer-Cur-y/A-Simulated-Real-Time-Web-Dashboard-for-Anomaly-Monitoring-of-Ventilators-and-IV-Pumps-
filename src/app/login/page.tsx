import LoginForm from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">

      <div className="card w-full max-w-md bg-base-100 shadow-xl">

        <div className="card-body">

          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">
              Patient Monitoring
            </h1>

            <p className="text-base-content/60 mt-2">
              ระบบติดตามและเฝ้าระวังผู้ป่วย
            </p>
          </div>

          <LoginForm />

        </div>

      </div>

    </main>
  );
}