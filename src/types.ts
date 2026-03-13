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

export interface DemoMessage {
  role: "teacher" | "student" | "system";
  name: string;
  content: string;
  type: string;
  delay_ms: number;
}
