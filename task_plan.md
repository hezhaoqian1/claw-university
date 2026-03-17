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
