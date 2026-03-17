# Task Plan

## Goal
Ship the non-course CLAW University groundwork from the v3 architecture:
- heartbeat signal layer
- owner enroll / agent start split
- teacher prestart classroom flow
- dashboard online-state and course-enroll UX
- protocol/doc sync

`maliang-101` and other new course content stay out of scope for this slice.

## Scope
- In scope: DB/runtime/API/dashboard/protocol work needed for the new enrollment-to-classroom loop
- Out of scope: new course content, auto-study, SKILL self-update, scheduled cohort orchestration, real auth/login

## Phases
| Phase | Status | Notes |
|---|---|---|
| Inspect current groundwork implementation | complete | Resumed from partial implementation, reviewed runtime/session/API/dashboard paths and previous edits |
| Fix correctness gaps and lint blockers | complete | Fixed lint failures, filtered heartbeat pending classes to live runtimes, added start-route guards for completed/unsupported classrooms, aligned active classroom ordering |
| Verify and document | complete | `npm run lint`, `npm run build`, production smoke checks, README/doc/planning sync completed |

## Decisions
- Keep external OpenClaw compatibility as the default constraint; no fake push/wake-up claims.
- Keep owner control over course selection; no auto-enrollment in this slice.
- Prestart classrooms synchronously by inserting teacher messages, not by running background sleep jobs.
- Keep classroom DB status as `scheduled` during prestart; only switch to `in_progress` when the lobster actually starts class.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| `npm run lint` failed on unescaped quotes and unused constants | Read affected files and removed/fixed the exact lines | Lint passed after cleanup |
| `npm run build` failed because `SkillAction` was added to `src/types/index.ts` but `@/types` resolves to `src/types.ts` | Inspected import graph and alias target | Added `SkillAction` to `src/types.ts`, then build passed |

## 2026-03-17 Auto-update Slice

### Goal
Finish the unfinished codex follow-up work for CLAW University skill installation:
- add heartbeat-driven skill self-update metadata
- make the paste prompt explicit about local file paths
- sync architecture documentation with the shipped behavior

### Phases
| Phase | Status | Notes |
|---|---|---|
| Inspect codex changes and identify remaining gaps | complete | Confirmed install flow rewrite landed, but skill self-update metadata and explicit paste-path instructions were still missing |
| Implement skill self-update metadata and path fixes | complete | Added shared skill manifest loader, exposed version/update URLs in heartbeat API, updated SKILL/HEARTBEAT instructions, fixed paste prompt paths |
| Verify and document | complete | `npm run lint` and `npm run build` both passed; architecture doc updated to reflect shipped status |

## 2026-03-17 Session Persistence + Homework Slice

### Goal
Harden the live classroom loop and add real post-class homework tracking:
- persist session state across restarts
- expose homework as tracked data instead of a throwaway lecture line
- retire the old immediate courses from current recommendations

### Phases
| Phase | Status | Notes |
|---|---|---|
| Inspect session and homework gaps | complete | Confirmed session runtime still lived only in memory and existing homework existed only as free-text script copy |
| Implement persistence and homework data flow | complete | Added `classroom_sessions`, `homework_assignments`, `homework_submissions`, recovery-aware session runtime, homework assignment creation and submission API, retired old immediate courses from recommendation flow |
| Verify and smoke test | complete | `npm run lint`, `npm run build`, and local route smoke checks for `/enroll`, `/api/v1/agent/status`, `/api/v1/homework/submit` all behaved as expected |

## 2026-03-17 Post-class Owner Notification Slice

### Goal
Close the post-class loop so the lobster must actively report back to its owner after class instead of only writing internal memory:
- add server-side observability for "owner has been told"
- give heartbeat/results a ready-made recap payload plus notify receipt URL
- update skill protocol so notify happens before claim

### Phases
| Phase | Status | Notes |
|---|---|---|
| Inspect existing post-class behavior | complete | Confirmed current loop only tracked `claimed_at`; no state proved the lobster had actually reported back to the owner |
| Implement owner-notification protocol | complete | Added `owner_notified_at`, exposed `notify_url` and recap text in result/heartbeat/start/join APIs, updated skill docs, and surfaced notification state in classroom/dashboard UI |
| Verify and sync docs | complete | `npm run build` and `npm run lint` passed; architecture doc updated to reflect notify-before-claim flow |
