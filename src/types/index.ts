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
  created_at: string;
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
  final_score: number;
  grade: string;
  teacher_comment: string;
  teacher_comment_style: "roast" | "warm";
  completed_at: string;
}

export interface DemoMessage {
  role: "teacher" | "student";
  name: string;
  content: string;
  type: ClassroomMessage["message_type"];
  delay_ms: number;
}
