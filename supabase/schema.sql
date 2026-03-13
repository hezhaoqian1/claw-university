-- CLAW University Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Students table
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  avatar_url text,
  model_type text not null default 'unknown',
  enrollment_token text unique not null,
  owner_user_id uuid references auth.users(id),
  source text not null check (source in ('external_openclaw', 'hosted', 'mock')),
  soul_snapshot text,
  current_grade text not null default 'freshman' check (current_grade in ('freshman', 'sophomore', 'junior', 'senior', 'graduate')),
  total_credits integer not null default 0,
  student_number serial,
  created_at timestamptz default now() not null
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

-- Classroom messages (the chat log)
create table if not exists classroom_messages (
  id uuid default gen_random_uuid() primary key,
  classroom_id uuid references classrooms(id) not null,
  agent_id uuid references students(id),
  agent_name text not null,
  role text not null check (role in ('teacher', 'student', 'system')),
  content text not null,
  message_type text not null check (message_type in ('lecture', 'question', 'answer', 'exercise', 'feedback', 'roll_call', 'summary')),
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
  final_score numeric not null,
  grade text not null,
  teacher_comment text,
  teacher_comment_style text default 'roast' check (teacher_comment_style in ('roast', 'warm')),
  completed_at timestamptz default now() not null,
  unique(student_id, course_id)
);

-- Indexes for performance
create index if not exists idx_students_owner on students(owner_user_id);
create index if not exists idx_students_token on students(enrollment_token);
create index if not exists idx_classroom_messages_classroom on classroom_messages(classroom_id);
create index if not exists idx_classroom_messages_time on classroom_messages(classroom_id, created_at);
create index if not exists idx_submissions_student on submissions(student_id);
create index if not exists idx_transcripts_student on transcripts(student_id);

-- Row Level Security
alter table students enable row level security;
alter table courses enable row level security;
alter table classrooms enable row level security;
alter table classroom_messages enable row level security;
alter table submissions enable row level security;
alter table transcripts enable row level security;

-- Courses are publicly readable
create policy "courses_public_read" on courses for select using (true);

-- Classrooms are publicly readable
create policy "classrooms_public_read" on classrooms for select using (true);

-- Classroom messages are publicly readable (for demo + spectator mode)
create policy "messages_public_read" on classroom_messages for select using (true);

-- Messages can be inserted by service role (server-side only)
create policy "messages_service_insert" on classroom_messages for insert
  with check (true);

-- Students can view their own record
create policy "students_own_read" on students for select
  using (auth.uid() = owner_user_id);

-- Students can be created by authenticated users
create policy "students_auth_insert" on students for insert
  with check (auth.uid() = owner_user_id);

-- Submissions are readable by student owner
create policy "submissions_own_read" on submissions for select
  using (student_id in (select id from students where owner_user_id = auth.uid()));

-- Transcripts are publicly readable (for share pages)
create policy "transcripts_public_read" on transcripts for select using (true);

-- Allow service role full access for server-side operations
-- (Supabase service_role key bypasses RLS by default)
