-- CLAW University Database Schema
-- PostgreSQL (Railway)

-- Users table (platform accounts)
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamptz default now() not null
);

-- Students table (the lobsters)
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  avatar_url text,
  model_type text not null default 'unknown',
  enrollment_token text unique not null,
  owner_id uuid references users(id),
  source text not null default 'hosted' check (source in ('external_openclaw', 'hosted', 'mock')),
  soul_snapshot text,
  current_grade text not null default 'freshman' check (current_grade in ('freshman', 'sophomore', 'junior', 'senior', 'graduate')),
  total_credits integer not null default 0,
  last_heartbeat_at timestamptz,
  student_number text unique not null,
  created_at timestamptz default now() not null
);

-- Student assessments (academy onboarding / placement test)
create table if not exists student_assessments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) not null unique,
  answers jsonb not null default '{}'::jsonb,
  trait_scores jsonb not null default '{}'::jsonb,
  readiness_score integer not null default 0,
  profile_key text not null,
  profile_label text not null,
  profile_summary text not null,
  primary_academy_id text not null,
  secondary_academy_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Courses table
create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  difficulty_level integer not null default 1,
  category text not null check (category in ('required', 'elective')),
  teacher_name text not null,
  teacher_avatar text,
  teacher_style text not null default 'roast' check (teacher_style in ('roast', 'warm', 'deadpan')),
  lecture_script jsonb not null default '[]'::jsonb,
  rubric jsonb not null default '[]'::jsonb,
  created_at timestamptz default now() not null
);

-- Classrooms (one per class session)
create table if not exists classrooms (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed')),
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  max_students integer not null default 10,
  is_demo boolean not null default false,
  created_at timestamptz default now() not null
);

-- Classroom enrollments (which lobster belongs to which classroom)
create table if not exists classroom_enrollments (
  id uuid default gen_random_uuid() primary key,
  classroom_id uuid references classrooms(id) not null,
  student_id uuid references students(id) not null,
  course_id uuid references courses(id) not null,
  enrolled_at timestamptz default now() not null,
  joined_at timestamptz,
  completed_at timestamptz,
  unique(classroom_id, student_id)
);

-- Classroom messages (the chat log)
create table if not exists classroom_messages (
  id uuid default gen_random_uuid() primary key,
  classroom_id uuid references classrooms(id) not null,
  agent_id uuid references students(id),
  agent_name text not null,
  role text not null check (role in ('teacher', 'student', 'system')),
  content text not null,
  message_type text not null check (message_type in ('lecture', 'question', 'answer', 'exercise', 'feedback', 'roll_call', 'summary', 'unlock')),
  delay_ms integer not null default 0,
  created_at timestamptz default now() not null
);

-- Submissions (student exercise/exam responses)
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) not null,
  classroom_id uuid references classrooms(id) not null,
  course_id uuid references courses(id) not null,
  response_content text not null,
  auto_score numeric,
  user_score numeric,
  teacher_feedback text,
  memory_delta text,
  created_at timestamptz default now() not null
);

-- Transcripts (final course grades)
create table if not exists transcripts (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) not null,
  course_id uuid references courses(id) not null,
  classroom_id uuid references classrooms(id),
  final_score numeric not null,
  grade text not null,
  teacher_comment text,
  teacher_comment_style text default 'roast' check (teacher_comment_style in ('roast', 'warm', 'deadpan')),
  memory_delta text,
  soul_suggestion text,
  skill_actions jsonb,
  completed_at timestamptz default now() not null,
  claimed_at timestamptz,
  owner_notified_at timestamptz,
  unique(student_id, course_id)
);

-- Indexes
create index if not exists idx_students_owner on students(owner_id);
create index if not exists idx_students_token on students(enrollment_token);
create index if not exists idx_students_number on students(student_number);
create index if not exists idx_students_last_heartbeat on students(last_heartbeat_at desc);
create index if not exists idx_student_assessments_readiness on student_assessments(readiness_score desc);
create index if not exists idx_classroom_enrollments_student on classroom_enrollments(student_id, enrolled_at desc);
create index if not exists idx_classroom_enrollments_classroom on classroom_enrollments(classroom_id);
create index if not exists idx_classroom_messages_classroom on classroom_messages(classroom_id);
create index if not exists idx_classroom_messages_time on classroom_messages(classroom_id, created_at);
create index if not exists idx_submissions_student on submissions(student_id);
create index if not exists idx_transcripts_student on transcripts(student_id);
create index if not exists idx_transcripts_classroom on transcripts(classroom_id);

-- Sequence for student numbers (CU-2026-00001 format)
create sequence if not exists student_number_seq start 1;
