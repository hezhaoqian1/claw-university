import type { StudentInstallBundle } from "@/lib/platform/install-bundle";
import type { PlatformClassroomState } from "@/lib/platform/classroom-state";
import type { StudentConnectionState } from "@/lib/students/connection";
import type {
  CourseCardContract,
  CourseCatalogContract,
} from "@/lib/courses/course-contract";

export interface PartnerMappingRef {
  id: string;
  externalStudentId: string | null;
  externalUserId: string | null;
}

interface DashboardPendingClassroom {
  classroomId: string;
  classroomUrl: string;
  [key: string]: unknown;
}

interface DashboardPendingHomework {
  classroomId: string;
  studentId?: string;
  [key: string]: unknown;
}

interface DashboardTranscript {
  classroomId: string;
  [key: string]: unknown;
}

interface DashboardStudent {
  id: string;
  [key: string]: unknown;
}

interface DashboardGrowth {
  pendingClassroom: DashboardPendingClassroom | null;
  pendingHomework: DashboardPendingHomework[];
  [key: string]: unknown;
}

interface DashboardView {
  student: DashboardStudent;
  growth: DashboardGrowth;
  transcripts: DashboardTranscript[];
  recommendations: CourseCatalogContract;
  [key: string]: unknown;
}

interface PartnerEventRow {
  id: string;
  partner_student_id: string | null;
  classroom_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export function buildPartnerClassroomStateHref(
  classroomId: string,
  partnerStudentId: string
) {
  return `/api/partner/v1/classrooms/${classroomId}/state?partner_student_id=${partnerStudentId}`;
}

export function buildPartnerClassroomMessagesHref(
  classroomId: string,
  partnerStudentId: string,
  after?: string | null
) {
  const url = new URL(
    `/api/partner/v1/classrooms/${classroomId}/messages`,
    "https://partner.claw.invalid"
  );
  url.searchParams.set("partner_student_id", partnerStudentId);

  if (after) {
    url.searchParams.set("after", after);
  }

  return `${url.pathname}${url.search}`;
}

export function rewritePartnerCourseCatalog(
  catalog: CourseCatalogContract,
  partnerStudentId: string
): CourseCatalogContract {
  return {
    ...catalog,
    cards: catalog.cards.map((card) => rewritePartnerCourseCard(card, partnerStudentId)),
  };
}

export function rewritePartnerConnectionState(params: {
  state: StudentConnectionState;
  mapping: PartnerMappingRef;
}) {
  return {
    partner_student_id: params.mapping.id,
    external_student_id: params.mapping.externalStudentId,
    external_user_id: params.mapping.externalUserId,
    student_name: params.state.student_name,
    status: params.state.status,
    hint: params.state.hint,
    created_at: params.state.created_at,
    last_heartbeat_at: params.state.last_heartbeat_at,
    heartbeat_age_seconds: params.state.heartbeat_age_seconds,
    pending_classroom: params.state.pending_classroom
      ? {
          ...params.state.pending_classroom,
          classroom_url: buildPartnerClassroomStateHref(
            params.state.pending_classroom.classroom_id,
            params.mapping.id
          ),
        }
      : null,
  };
}

export function rewritePartnerDashboard(params: {
  dashboard: DashboardView;
  mapping: PartnerMappingRef;
}) {
  return {
    ...params.dashboard,
    partner_student_id: params.mapping.id,
    external_student_id: params.mapping.externalStudentId,
    external_user_id: params.mapping.externalUserId,
    student: {
      ...params.dashboard.student,
      id: params.mapping.id,
    },
    growth: {
      ...params.dashboard.growth,
      pendingClassroom: params.dashboard.growth.pendingClassroom
        ? {
            ...params.dashboard.growth.pendingClassroom,
            classroomUrl: buildPartnerClassroomStateHref(
              params.dashboard.growth.pendingClassroom.classroomId,
              params.mapping.id
            ),
          }
        : null,
      pendingHomework: params.dashboard.growth.pendingHomework.map((homework) => {
        const { studentId, ...rest } = homework;
        void studentId;
        return {
          ...rest,
          classroomUrl: buildPartnerClassroomStateHref(homework.classroomId, params.mapping.id),
        };
      }),
    },
    transcripts: params.dashboard.transcripts.map((transcript) => ({
      ...transcript,
      classroomUrl: buildPartnerClassroomStateHref(transcript.classroomId, params.mapping.id),
    })),
    recommendations: rewritePartnerCourseCatalog(
      params.dashboard.recommendations,
      params.mapping.id
    ),
  };
}

export function rewritePartnerClassroomState(params: {
  state: PlatformClassroomState;
  partnerStudentId: string;
}) {
  const stateUrl = buildPartnerClassroomStateHref(
    params.state.classroom_id,
    params.partnerStudentId
  );
  const messagesUrl = buildPartnerClassroomMessagesHref(
    params.state.classroom_id,
    params.partnerStudentId
  );
  const { student_id, ...rest } = params.state;
  void student_id;

  return {
    ...rest,
    partner_student_id: params.partnerStudentId,
    actions: {
      classroom_url: stateUrl,
      start_url: null,
      messages_url: messagesUrl,
      respond_url: null,
      result_url: params.state.result.ready ? stateUrl : null,
      notify_url: null,
      claim_url: null,
      deliverable_submit_url: null,
    },
  };
}

export function rewritePartnerEvent(row: PartnerEventRow) {
  return {
    id: row.id,
    partner_student_id: row.partner_student_id,
    classroom_id: row.classroom_id,
    classroom_state_url:
      row.classroom_id && row.partner_student_id
        ? buildPartnerClassroomStateHref(row.classroom_id, row.partner_student_id)
        : null,
    event_type: row.event_type,
    payload: row.payload,
    created_at: row.created_at,
  };
}

export function rewritePartnerInstallBundle(params: {
  bundle: StudentInstallBundle;
  mapping: PartnerMappingRef;
}) {
  const { student_id, student_name, student_number, ...rest } = params.bundle;
  void student_id;

  return {
    partner_student_id: params.mapping.id,
    external_student_id: params.mapping.externalStudentId,
    external_user_id: params.mapping.externalUserId,
    student: {
      id: params.mapping.id,
      name: student_name,
      student_number,
    },
    student_name,
    student_number,
    ...rest,
  };
}

function rewritePartnerCourseCard(
  card: CourseCardContract,
  partnerStudentId: string
): CourseCardContract {
  const classroomStateUrl = card.runtime.classroomId
    ? buildPartnerClassroomStateHref(card.runtime.classroomId, partnerStudentId)
    : null;

  return {
    ...card,
    runtime: {
      ...card.runtime,
      classroomUrl: classroomStateUrl,
    },
    action: {
      ...card.action,
      href: card.action.kind === "enter_classroom" ? classroomStateUrl : card.action.href,
      payload: card.action.payload
        ? {
            ...card.action.payload,
            studentId: partnerStudentId,
          }
        : null,
    },
  };
}
