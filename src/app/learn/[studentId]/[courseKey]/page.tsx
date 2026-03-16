import { notFound } from "next/navigation";
import { CourseLauncher } from "@/components/student/course-launcher";
import { maybeGetCourseRuntimeByKey } from "@/lib/courses/registry";

export default async function CourseLaunchPage({
  params,
}: {
  params: Promise<{ studentId: string; courseKey: string }>;
}) {
  const { studentId, courseKey } = await params;
  const runtime = maybeGetCourseRuntimeByKey(courseKey);

  if (!runtime) {
    notFound();
  }

  return (
    <CourseLauncher
      studentId={studentId}
      courseKey={courseKey}
      courseName={runtime.meta.name}
    />
  );
}
