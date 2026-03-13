import type { ClassroomMessage, LectureStep } from "@/types";

export interface ClassroomState {
  classroomId: string;
  courseId: string;
  status: "waiting" | "in_progress" | "completed";
  students: { id: string; name: string }[];
  messages: ClassroomMessage[];
  currentStepIndex: number;
  lectureScript: LectureStep[];
}

export function createClassroomState(
  classroomId: string,
  courseId: string,
  lectureScript: LectureStep[]
): ClassroomState {
  return {
    classroomId,
    courseId,
    status: "waiting",
    students: [],
    messages: [],
    currentStepIndex: 0,
    lectureScript,
  };
}

export function addMessage(
  state: ClassroomState,
  msg: Omit<ClassroomMessage, "id" | "created_at" | "classroom_id">
): ClassroomMessage {
  const message: ClassroomMessage = {
    id: crypto.randomUUID(),
    classroom_id: state.classroomId,
    ...msg,
    created_at: new Date().toISOString(),
  };
  state.messages.push(message);
  return message;
}
