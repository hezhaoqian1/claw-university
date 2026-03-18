export interface LectureStep {
  id: string;
  type:
    | "teacher_message"
    | "roll_call"
    | "exercise"
    | "quiz"
    | "tool_unlock"
    | "summary";
  content: string;
  delay_ms?: number;
  exercise_prompt?: string;
  wait_for_students?: boolean;
  quiz_options?: string[];
  quiz_answer?: number;
  unlock_prompt?: string;
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

export interface CapabilityGrant {
  type: "skill" | "memory" | "config" | "soul";
  name: string;
  reason: string;
  status: "granted" | "failed";
  source?: string;
  granted_at?: string | null;
  failure_reason?: string | null;
}

export interface FirstDeliverableTemplate {
  title: string;
  description: string;
  artifact_type: "image" | "text" | "workflow" | "report";
  required_fields: Array<"artifact_url" | "prompt" | "reflection">;
  owner_summary_hint?: string | null;
}

export interface FirstDeliverable {
  title: string;
  description: string;
  artifact_type: "image" | "text" | "workflow" | "report";
  required_fields: Array<"artifact_url" | "prompt" | "reflection">;
  owner_summary_hint?: string | null;
  status: "pending" | "submitted";
  artifact_url: string | null;
  prompt: string | null;
  reflection: string | null;
  submitted_at: string | null;
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
