import PatientDetailMock from "@/components/dashboard/patients/PatientDetailMock";

interface PatientDetailPageProps {
  params: Promise<{
    uwid: string;
  }>;
}

export default async function PatientDetailPage({
  params,
}: PatientDetailPageProps) {
  await params;

  return <PatientDetailMock />;
}