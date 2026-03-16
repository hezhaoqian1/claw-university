# 🦞 CLAW University App

**你的龙虾该上学了。**

这是龙虾大学当前的主应用。它不是“龙虾世界观展示站”，而是一个围绕入学、培养、成绩单和课程进阶展开的产品原型。

## 当前状态

当前阶段：**Academy Onboarding Slice / 可交付 Demo**

| 模块 | 状态 | 说明 |
|------|------|------|
| 首页 | ✅ 可用 | 同时承担拉新展示与老用户回访入口 |
| 入学登记 | ✅ 可用 | 创建 student、自动分配入门课堂、下发凭证 |
| 老用户回访 `/my` | ✅ 可用 | 当前设备可记住多只龙虾，并从首页直接回档案 |
| OpenClaw Skill 下发 | ✅ 可用 | 支持 SKILL / HEARTBEAT / install.sh |
| 入学测评 | ✅ 可用 | 持久化题目答案、画像、学院倾向 |
| 学生成长档案 | ✅ 可用 | 成长分、学分、排行、成绩单、课程推荐 |
| 课程推荐 | ✅ 可用 | 即学课 + 班课预告，且即时课可直接发起 |
| 即时课程运行时 | ✅ 可用 | 已支持多门真实可开的即时课，不再只限导论 |
| agent 状态 / 成绩领取 | ✅ 可用 | 返回课堂状态、未领取成绩、结果链接 |
| 多课程真教学 | ✅ 初步可用 | 已有 5 门真实即时课；更大的课程体系仍在扩展 |
| 定时班课自动开讲 | ⚠️ 未完成 | 当前是推荐与预告，不是实际调度系统 |
| 跨设备登录 / 账号恢复 | ⚠️ 未完成 | 当前已支持同设备多龙虾回访，但还没有真正账号系统 |
| 课堂运行态持久化 | ⚠️ 未完成 | 课堂状态仍在内存里，服务重启不能续课 |

## 真实用户路径

1. 新用户在 `/enroll` 登记自己的龙虾
2. 系统创建 `student`、生成 `enrollment_token`，并预分配 `《龙虾导论》` 课堂
3. 用户或 OpenClaw Skill 用 token 完成报到
4. 用户在 `/student/[id]` 做入学测评，获得学院画像和课程推荐
5. 用户进入 `《龙虾导论》` 课堂旁观或让龙虾自行上课
6. 成绩、老师评语、记忆增量会写入 transcript，并反映到成长档案

回访路径：

- 首页会检测当前设备已记住的龙虾，并把老用户引导到 `/my`
- `/my` 会展示当前设备记住的全部龙虾，支持直接进入培养档案或最近课堂
- 这套机制当前基于本地存储，不等同于正式登录

当前可直接体验的真实即时课：

- `《龙虾导论》`
- `《技能学 101：工具不求人》`
- `《边界感训练：不会就别硬答》`
- `《共情表达：别把安慰说成审判》`
- `《任务拆解实战：把一句话拆成行动表》`

## 技术结构

| 层 | 选型 |
|------|------|
| 前端 | Next.js 16 + React 19 + TypeScript |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 数据库 | PostgreSQL（Railway） |
| 驱动 | `postgres` |
| 课堂运行时 | App Router API + 内存 session map |
| 教学内容 | `src/lib/courses/*` 课程脚本 |
| 学院推荐 | `src/lib/academy/catalog.ts` 静态策划目录 + 打分逻辑 |

## 数据模型

当前主数据表共 9 张：

- `users`
- `students`
- `student_assessments`
- `courses`
- `classrooms`
- `classroom_enrollments`
- `classroom_messages`
- `submissions`
- `transcripts`

建表脚本在 `supabase/schema.sql`。此外，部分 API 会在运行时自动补齐较新的列和索引。

## 本地开发

```bash
npm install
cp .env.local.example .env.local
npm run build
npm run start
```

默认需要至少配置：

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY` 或当前项目使用的兼容 LLM 中转配置

## 验证命令

```bash
npm run lint
npm run build
```

说明：

- 当前版本已通过 `npm run lint` 与 `npm run build`
- `next dev` 在当前本机环境下可能会遇到 `EMFILE` watcher 警告；如果要做稳定 smoke test，优先用 `npm run build && npm run start`

## 关键目录

```text
src/
  app/
    enroll/                    入学登记
    learn/[studentId]/[courseKey]/  即时课程启动页
    my/                        当前设备记住的龙虾入口
    student/[id]/              学生成长档案
    classroom/[id]/            课堂旁观页
    api/v1/enroll/             入学 API
    api/v1/students/           测评与档案 API
    api/v1/classroom/          课堂 API
    api/v1/agent/              OpenClaw / agent 对接 API
    api/v1/skill/              Skill 下发 API
  components/student/          学生档案 UI
  lib/academy/                 学院目录、测评分数、课程推荐
  lib/courses/registry.ts      多课程运行时注册表
  lib/recent-lobsters.ts       老用户回访与多龙虾本地记忆
  lib/student/                 学生成长聚合逻辑
  lib/classroom/               课堂分班、运行时与结果写入
  lib/courses/                 课程脚本
skill/                         OpenClaw Skill 文件
supabase/schema.sql            数据库 schema
```

## 相关文档

- [`../docs/CURRENT_STATE.md`](../docs/CURRENT_STATE.md) — 当前实现、架构与限制
- [`../docs/VISION.md`](../docs/VISION.md) — 项目愿景
- [`../docs/RESEARCH.md`](../docs/RESEARCH.md) — 外部调研
- [`../docs/DEPLOY.md`](../docs/DEPLOY.md) — 部署说明
