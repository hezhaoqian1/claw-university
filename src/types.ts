export interface LectureStep {
  id: string;
  type: "teacher_message" | "roll_call" | "exercise" | "quiz" | "summary";
  content: string;
  delay_ms?: number;
  exercise_prompt?: string;
  wait_for_students?: boolean;
  quiz_options?: string[];
  quiz_answer?: number;
}

export interface RubricItem {
  name: string;
  description: string;
  max_score: number;
}

export interface SkillAction {
  type: "install_skill" | "add_config";
  name: string;
  source?: string;
  value?: string;
  reason: string;
}

export type HomeworkSubmissionFormat = "text" | "text_or_image";

export interface HomeworkTemplate {
  title: string;
  description: string;
  submission_format: HomeworkSubmissionFormat;
  due_in_hours: number;
}

export interface DemoMessage {
  role: "teacher" | "student" | "system";
  name: string;
  content: string;
  type: string;
  delay_ms: number;
}
