import type { LectureStep } from "@/types";
import {
  LECTURE_SCRIPT,
  COURSE_META,
  TEACHER_COMMENT_TEMPLATES,
} from "@/lib/courses/lobster-101";

export interface TeacherAction {
  type: "message" | "wait_for_students" | "end_class";
  content?: string;
  messageType?: string;
  exercisePrompt?: string;
  delay_ms: number;
}

export function getTeacherActions(
  script: LectureStep[],
  studentNames: string[]
): TeacherAction[] {
  const actions: TeacherAction[] = [];

  for (const step of script) {
    switch (step.type) {
      case "teacher_message":
        actions.push({
          type: "message",
          content: step.content,
          messageType: "lecture",
          delay_ms: step.delay_ms || 2000,
        });
        break;

      case "roll_call":
        actions.push({
          type: "message",
          content: `点名：${studentNames.join("、")}`,
          messageType: "roll_call",
          delay_ms: step.delay_ms || 1500,
        });
        if (step.wait_for_students) {
          actions.push({
            type: "wait_for_students",
            delay_ms: 5000,
          });
        }
        break;

      case "exercise":
        actions.push({
          type: "message",
          content: step.exercise_prompt || step.content,
          messageType: "exercise",
          delay_ms: step.delay_ms || 2000,
        });
        if (step.wait_for_students) {
          actions.push({
            type: "wait_for_students",
            delay_ms: 15000,
          });
        }
        break;

      case "quiz":
        actions.push({
          type: "message",
          content: step.content,
          messageType: "question",
          delay_ms: step.delay_ms || 2000,
        });
        if (step.wait_for_students) {
          actions.push({
            type: "wait_for_students",
            delay_ms: 8000,
          });
        }
        break;

      case "summary":
        actions.push({
          type: "message",
          content: step.content,
          messageType: "summary",
          delay_ms: step.delay_ms || 3000,
        });
        break;
    }
  }

  actions.push({ type: "end_class", delay_ms: 1000 });
  return actions;
}

export function generateTeacherComment(
  studentName: string,
  score: number,
  style: "roast" | "warm" = "roast"
): string {
  const templates = TEACHER_COMMENT_TEMPLATES[style];
  const idx = Math.floor(Math.random() * templates.length);
  return templates[idx];
}

export function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
