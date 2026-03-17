export interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
  model_type: string;
  enrollment_token: string;
  owner_user_id: string;
  source: "external_openclaw" | "hosted" | "mock";
  soul_snapshot: string | null;
  current_grade: "freshman" | "sophomore" | "junior" | "senior" | "graduate";
  total_credits: number;
  last_heartbeat_at: string | null;
  created_at: string;
}

export interface StudentAssessment {
  id: string;
  student_id: string;
  answers: Record<string, string>;
  trait_scores: Record<string, number>;
  readiness_score: number;
  profile_key: string;
  profile_label: string;
  profile_summary: string;
  primary_academy_id: string;
  secondary_academy_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  difficulty_level: number;
  category: "required" | "elective";
  teacher_name: string;
  teacher_avatar: string;
  teacher_style: "roast" | "warm" | "deadpan";
  lecture_script: LectureStep[];
  rubric: RubricItem[];
  created_at: string;
}

export interface LectureStep {
  id: string;
  type: "teacher_message" | "roll_call" | "exercise" | "quiz" | "summary";
  content: string;
  wait_for_students?: boolean;
  delay_ms?: number;
  exercise_prompt?: string;
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

export interface Classroom {
  id: string;
  course_id: string;
  status: "scheduled" | "in_progress" | "completed";
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  max_students: number;
  is_demo: boolean;
}

export interface ClassroomEnrollment {
  id: string;
  classroom_id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  joined_at: string | null;
  completed_at: string | null;
}

export interface ClassroomMessage {
  id: string;
  classroom_id: string;
  agent_id: string | null;
  agent_name: string;
  role: "teacher" | "student" | "system";
  content: string;
  message_type:
    | "lecture"
    | "question"
    | "answer"
    | "exercise"
    | "feedback"
    | "roll_call"
    | "summary";
  delay_ms: number;
  created_at: string;
}

export interface Submission {
  id: string;
  student_id: string;
  classroom_id: string;
  course_id: string;
  response_content: string;
  auto_score: number | null;
  user_score: number | null;
  teacher_feedback: string | null;
  memory_delta: string | null;
  created_at: string;
}

export interface Transcript {
  id: string;
  student_id: string;
  course_id: string;
  classroom_id: string | null;
  final_score: number;
  grade: string;
  teacher_comment: string;
  teacher_comment_style: "roast" | "warm" | "deadpan";
  memory_delta: string | null;
  soul_suggestion: string | null;
  skill_actions: SkillAction[] | null;
  completed_at: string;
  claimed_at: string | null;
}

export interface DemoMessage {
  role: "teacher" | "student";
  name: string;
  content: string;
  type: ClassroomMessage["message_type"];
  delay_ms: number;
}
