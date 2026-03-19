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

## 2026-03-17 Course Homework Hardening Slice

### Goal
Make every live course end with a real tracked homework action instead of leaving the lobster to improvise its "next step":
- add explicit homework templates to current course runtimes
- add a system fallback for future runtimes that forget to define homework
- tighten protocol/docs so normal homework is done directly, not re-delegated to the owner

### Phases
| Phase | Status | Notes |
|---|---|---|
| Audit current course homework behavior | complete | Confirmed multiple course scripts already mention homework in teacher dialogue, but only `maliang-101` created a real tracked homework record |
| Implement runtime homework guarantees | complete | Added homework templates for all current live runtimes plus `resolveCourseHomework()` fallback; session finish now always assigns homework |
| Tighten protocol and refresh docs | complete | Updated `SKILL.md`, `HEARTBEAT.md`, `ARCHITECTURE.md`, and `ARCHITECTURE_V3.md`; `npm run build` and `npm run lint` passed |

## 2026-03-18 Course Design System Slice

### Goal
Write a full product/design architecture for:
- upgrading `maliang-101` into a stronger first formal course
- defining a reusable course design pattern for future classes
- defining a contributor model so courses can eventually be submitted like skills

### Phases
| Phase | Status | Notes |
|---|---|---|
| Inspect runtime, catalog, and protocol constraints | complete | Reviewed current `maliang-101`, registry/catalog metadata, classroom playback, session outputs, and repo architecture docs |
| Design the upgraded Maliang class | complete | Defined the course promise, classroom arc, capability-unlock milestone, first deliverable, and owner-facing payoff |
| Design the reusable course framework | complete | Defined the 9-step course flow, standardized outputs, runtime/manifest target model, and course submission/review workflow |
| Document the proposal in repo docs | complete | Added `docs/COURSE_SYSTEM.md` and linked it from `README.md` |

## 2026-03-18 Maliang Runtime Upgrade Slice

### Goal
Implement the first real "tool course" runtime loop:
- in-class skill unlock for `maliang-101`
- post-class first deliverable submission before notify/claim
- owner-facing UI and recap updates so the artifact is visible

### Phases
| Phase | Status | Notes |
|---|---|---|
| Extend course/runtime/result data model | complete | Added `tool_unlock`, `unlockActions`, `capability_grants`, and `first_deliverable` contracts plus transcript schema extensions |
| Implement classroom/runtime flow | complete | `maliang-101` now includes an unlock step; classroom session blocks on unlock success before completion |
| Implement result submission + UI | complete | Added deliverable submit API, result/status payloads, result page rendering, and recap/owner-report ordering |
| Verify | complete | `npm run lint` and `npm run build` both passed |

## 2026-03-18 Reliability + Doc Sync Slice

### Goal
Close the remaining correctness/documentation gap after the Maliang runtime upgrade:
- make session recovery safe during final grading
- remove misleading capability-grant fallback behavior
- sync repo docs with the shipped tool-course loop

### Phases
| Phase | Status | Notes |
|---|---|---|
| Audit implementation and docs drift | complete | Confirmed final-grading restart could hang a classroom and top-level docs still described pre-tool-course behavior |
| Patch recovery and metadata behavior | complete | `resumeSessionIfNeeded()` now resumes `finishSession()` after restart-at-grading; transcript grants now only reflect confirmed unlocks |
| Sync docs | complete | README + architecture docs now describe persistent sessions, promoted course set, and the unlock/first-deliverable loop |

## 2026-03-18 Documentation Layer Split Slice

### Goal
Fix the structural documentation problem so future maintenance stops mixing shipped facts, single-course design, and future proposals in the same file.

### Phases
| Phase | Status | Notes |
|---|---|---|
| Audit current doc-type mixing | complete | Confirmed README contradicted itself on runtime persistence and old `COURSE_SYSTEM.md` mixed fact/design/future states |
| Split docs by ownership layer | complete | Rewrote `COURSE_SYSTEM.md` as shipped fact layer, added `MALIANG_101.md`, and moved future-only content into `COURSE_PLATFORM_FUTURE.md` |
| Sync entry points | complete | README links and `ARCHITECTURE_V3.md` header now point readers to the correct source-of-truth document first |

## 2026-03-18 Architecture Doc Fact Cleanup Slice

### Goal
Finish the doc-layer cleanup by making `ARCHITECTURE.md` a clean current-state architecture reference and preventing `ARCHITECTURE_V3.md` from being misread as current truth.

### Phases
| Phase | Status | Notes |
|---|---|---|
| Audit remaining architecture-doc drift | complete | Confirmed `ARCHITECTURE.md` still had stale runtime/result descriptions and a roadmap-style `待办` section |
| Patch current-state architecture doc | complete | Updated runtime fields, result contract, API list, and current limitations to match the shipped tool-course loop |
| Reinforce blueprint positioning | complete | `ARCHITECTURE_V3.md` now explicitly tells readers to use README / COURSE_SYSTEM first for current implementation decisions |

## 2026-03-18 OpenClaw Install + Auto-start Hardening Slice

### Goal
Fix the real-world protocol gap where the lobster still asked for permission to start an already-approved class and misread classroom-time tool unlock as a post-result skill installation.

### Phases
| Phase | Status | Notes |
|---|---|---|
| Audit field-level ambiguity from live transcript | complete | Confirmed `pending_classroom` lacked a hard "start immediately" signal and Maliang unlock copy did not clearly separate in-class install from post-class `skill_actions` |
| Patch API + protocol + course copy | complete | Added explicit preapproval metadata to `pending_classroom`, hardened `SKILL.md` / `HEARTBEAT.md`, and rewrote Maliang unlock prompt around a concrete OpenClaw install command |
| Verify | complete | `npm run lint` and `npm run build` passed after the protocol hardening |
