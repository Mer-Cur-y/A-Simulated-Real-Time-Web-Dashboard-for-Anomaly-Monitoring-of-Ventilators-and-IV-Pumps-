import PatientDetail from "@/components/dashboard/patients/PatientDetail";

interface PatientDetailPageProps {
  params: Promise<{
    uwid: string;
  }>;
}

export default async function PatientDetailPage({
  params,
}: PatientDetailPageProps) {
  const { uwid } = await params;

  return <PatientDetail uwid={uwid} />;
}