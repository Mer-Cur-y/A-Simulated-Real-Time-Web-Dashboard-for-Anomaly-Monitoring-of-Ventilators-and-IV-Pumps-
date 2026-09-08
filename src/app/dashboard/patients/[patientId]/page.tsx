import PatientDetail from "@/components/patient-detail/PatientDetail";

interface Props {
  params: Promise<{
    patientId: string;
  }>;
}

export default async function PatientDetailPage({
  params,
}: Props) {
  const { patientId } = await params;

  return (
    <PatientDetail
      patientId={patientId}
    />
  );
}