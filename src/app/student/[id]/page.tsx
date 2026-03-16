import { StudentDashboard } from "@/components/student/student-dashboard";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <StudentDashboard studentId={id} />;
}
