import type {
  AcademyDimension,
  CourseBlueprint,
  CourseExperience,
} from "@/lib/academy/catalog";

export type CourseEnrollmentStatus =
  | "not_enrolled"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "planned";

export type CourseActionKind =
  | "enter_classroom"
  | "enroll"
  | "retrain"
  | "preview"
  | "planned";

export interface CourseActionPayload {
  courseKey: string;
  studentId: string;
}

export interface CourseCardContract {
  id: string;
  courseKey: string;
  name: string;
  category: CourseBlueprint["category"];
  academy: {
    id: string;
    name: string;
  };
  teacher: {
    name: string;
    style: CourseBlueprint["teacherStyle"];
  };
  summary: {
    description: string;
    outcome: string;
    vibe: string;
  };
  difficulty: number;
  experience: {
    offeringMode: CourseExperience["offeringMode"];
    programShape: CourseExperience["programShape"];
    participationMode: CourseExperience["participationMode"];
    durationLabel: string;
    deliveryLabel: string;
    attendanceLabel: string;
  };
  recommendation: {
    reason: string;
    weakestDimension: AcademyDimension | null;
    needScore: number | null;
  } | null;
  runtime: {
    liveRuntime: boolean;
    status: CourseEnrollmentStatus;
    statusLabel: string;
    classroomId: string | null;
    classroomUrl: string | null;
  };
  scheduling: {
    startsAt: string | null;
    seatLimit: number | null;
    enrolledCount: number | null;
    seatsLeft: number | null;
    note: string | null;
  };
  action: {
    kind: CourseActionKind;
    label: string;
    href: string | null;
    disabled: boolean;
    payload: CourseActionPayload | null;
  };
}

export interface CourseCatalogSummary {
  totalCount: number;
  liveNowCount: number;
  immediateCount: number;
  scheduledCount: number;
  phasedCount: number;
  cohortCount: number;
}

export interface CourseCatalogContract {
  cards: CourseCardContract[];
  summary: CourseCatalogSummary;
}

export function formatCourseDeliveryLabel(experience: CourseExperience) {
  if (experience.programShape === "phased") {
    return experience.offeringMode === "scheduled" ? "分期班课" : "分期课";
  }

  if (experience.offeringMode === "scheduled") {
    return experience.participationMode === "cohort" ? "定时班课" : "定时课";
  }

  return experience.participationMode === "cohort" ? "即学工坊" : "即学课";
}

export function formatCourseAttendanceLabel(experience: CourseExperience) {
  if (experience.participationMode === "cohort") {
    return experience.offeringMode === "scheduled" ? "老师按时点名" : "多人同场";
  }

  if (experience.programShape === "phased") {
    return "分阶段推进";
  }

  return experience.offeringMode === "immediate" ? "现在可学" : "按时开讲";
}

export function buildCourseCatalogSummary(
  cards: CourseCardContract[]
): CourseCatalogSummary {
  return {
    totalCount: cards.length,
    liveNowCount: cards.filter((card) => card.runtime.liveRuntime).length,
    immediateCount: cards.filter(
      (card) => card.experience.offeringMode === "immediate"
    ).length,
    scheduledCount: cards.filter(
      (card) => card.experience.offeringMode === "scheduled"
    ).length,
    phasedCount: cards.filter(
      (card) => card.experience.programShape === "phased"
    ).length,
    cohortCount: cards.filter(
      (card) => card.experience.participationMode === "cohort"
    ).length,
  };
}
