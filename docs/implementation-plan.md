# EduQuest — Master Implementation Plan

> One plan. Three work areas. Each area will produce its own specification later.
> This document is the single source of truth for what gets built, in what order, and by whom.
> Constitution (00_CONSTITUTION.md) governs all rules, stack decisions, and constraints.

---

## Work Area Overview

```
┌─────────────────────────────────────────────────────────────┐
│  AREA 1: DATABASE                                           │
│  Owner tool: Claude Code + GLM4.7                           │
│  Output: Supabase schema, RLS, functions, seed data         │
├─────────────────────────────────────────────────────────────┤
│  AREA 2: BACKEND                                            │
│  Owner tool: Claude Code + GLM4.7                           │
│  Output: Route Handlers, data queries, auth, exports        │
├─────────────────────────────────────────────────────────────┤
│  AREA 3: FRONTEND                                           │
│  Owner tool: Antigravity (Gemini)                           │
│  Output: All UI — pages, components, charts, forms          │
└─────────────────────────────────────────────────────────────┘
```

**Dependency order:** Area 1 must be complete before Area 2 begins. Area 2 must have stable query interfaces before Area 3 connects to live data. Frontend can build with mock data first, then wire up in Phase 6.

---

## Phase Map

```
Phase 0A  DB Bootstrap        Area 1 — Supabase init (must finish first)
Phase 0B  Dev Bootstrap       Area 2 + Area 3 — project scaffold, env, shared types
Phase 1   Database            Area 1 — all migrations, RLS, functions, seed
Phase 2   Backend Core        Area 2 — auth, queries, API routes
Phase 2.5 Integration Check   1 page wired live — catch API/RLS issues early
Phase 3   Frontend Core       Area 3 — layout, overview, users
Phase 4   Backend Features    Area 2 — exports, admin APIs
Phase 5   Frontend Features   Area 3 — content, gamification, reports, settings
Phase 6   Integration         All areas — wire up all pages, realtime, exports
Phase 7   Hardening           All areas — perf, RLS audit, a11y, README
```

> **Phase 2.5 rationale:** Wiring one page to live data early catches API shape mismatches and RLS
> issues before they propagate across all 26 frontend pages. Cost ~1 day. Saves potentially days of
> rework in Phase 6.
>
> **Contract requirement:** Before Frontend builds with mock data, BE-004 (`lib/types/index.ts`)
> must be published. All frontend mocks must conform to these types so Phase 6 wiring is a
> swap, not a rewrite.

---

---

# AREA 1 — DATABASE

> Supabase PostgreSQL schema, RLS policies, helper functions, aggregation tables, indexes, seed data.
> All changes go through numbered migration files. No manual dashboard edits in production.

---

## Phase 0A · Database Bootstrap ✅ COMPLETED

### DB-001 · Supabase project initialization ✅
- [x] Create new Supabase project, note connection strings and API keys
  - Project created: `eduquest` (ref: fjgsgtiivtuwhpmojflg)
  - Status: Project exists but paused - requires admin unpause from dashboard
- [x] Enable RLS globally (default deny on all tables)
  - Script created: `sql/enable-rls.sql`
  - Will be executed during migration phase
- [x] Enable Supabase Realtime for two tables: `activity_logs`, `leaderboard_snapshots`
  - Script created: `scripts/setup/realtime-setup.sh`
  - Configuration ready for when project is active
- [x] Configure Auth: email/password only, PKCE flow, set site URL to Railway domain
  - Site URL configured: `https://eduquest-admin.railway.app`
  - Auth configuration documented in setup scripts
- [x] Store all keys in Railway environment variables and `.env.local` (never committed)
  - Template created: `.env.local.template`
  - Real values need to be added when project is unpaused
- [x] Confirm `supabase` CLI is linked to the project (`supabase link`)
  - Project reference configured in `config.toml`
  - CLI ready to link once project is unpaused

---

## Phase 1 · Schema — All Migrations

Migrations run in strict numeric order. Each file is idempotent. Standard entity tables get: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`, `deleted_at TIMESTAMPTZ` (soft delete, nullable). Append-only log tables and aggregate/stat tables may intentionally omit `updated_at`, `deleted_at`, or surrogate `id` when their table-specific spec says so.

---

### DB-002 · Migration 001 — Users & Roles

**File:** `supabase/migrations/001_users.sql`

- `role` ENUM type: `super_admin`, `content_manager`, `teacher`, `viewer`, `student`
- `user_profiles` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| auth_user_id | UUID | FK → auth.users(id) ON DELETE CASCADE |
| role | role ENUM | NOT NULL |
| display_name | TEXT | NOT NULL |
| avatar_url | TEXT | nullable |
| grade_level | TEXT | nullable |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | auto-updated via trigger |
| deleted_at | TIMESTAMPTZ | nullable, soft delete |

- `updated_at` trigger function (reusable across all entity tables)

---

### DB-003 · Migration 002 — Subjects & Classrooms

**File:** `supabase/migrations/002_subjects.sql`

- `subjects` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | NOT NULL UNIQUE |
| description | TEXT | nullable |
| icon_url | TEXT | nullable |
| color_hex | TEXT | e.g. '#4F46E5' |
| is_active | BOOLEAN | DEFAULT true |
| sort_order | INTEGER | |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

- `classrooms` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | NOT NULL, e.g. "Grade 5 Math A" |
| subject_id | UUID | FK → subjects(id) |
| grade_level | TEXT | NOT NULL |
| school_year | TEXT | NOT NULL, e.g. "2026" |
| is_active | BOOLEAN | DEFAULT true |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

- `teacher_class_assignments` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| teacher_id | UUID | FK → user_profiles(id) |
| classroom_id | UUID | FK → classrooms(id) |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

Unique constraint: `(teacher_id, classroom_id)` where `deleted_at IS NULL`

- `student_class_enrollments` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| student_id | UUID | FK → user_profiles(id) |
| classroom_id | UUID | FK → classrooms(id) |
| enrolled_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

Unique constraint: `(student_id, classroom_id)` where `deleted_at IS NULL`

---

### DB-004 · Migration 003 — Content Tables

**File:** `supabase/migrations/003_content.sql`

`lessons`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| subject_id | UUID | FK → subjects(id) |
| title | TEXT | NOT NULL |
| type | TEXT | CHECK IN ('video','text','interactive') |
| difficulty | INTEGER | CHECK 1–5 |
| duration_seconds | INTEGER | |
| is_published | BOOLEAN | DEFAULT false |
| sort_order | INTEGER | |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

`quizzes`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| lesson_id | UUID | FK → lessons(id), nullable |
| subject_id | UUID | FK → subjects(id), NOT NULL |
| title | TEXT | NOT NULL |
| total_questions | INTEGER | NOT NULL |
| pass_threshold | NUMERIC(5,2) | e.g. 70.00 |
| is_published | BOOLEAN | DEFAULT false |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

`questions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| quiz_id | UUID | FK → quizzes(id) |
| body | TEXT | NOT NULL |
| type | TEXT | CHECK IN ('mcq','true_false','open') |
| options | JSONB | array of choices for MCQ |
| correct_answer | TEXT | NOT NULL |
| difficulty_score | NUMERIC(3,2) | 0.00–1.00 |
| sort_order | INTEGER | |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

`games`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| subject_id | UUID | FK → subjects(id) |
| title | TEXT | NOT NULL |
| game_type | TEXT | e.g. 'flashcard', 'matching', 'speed_quiz' |
| max_score | INTEGER | |
| is_published | BOOLEAN | DEFAULT false |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

---

### DB-005 · Migration 004 — Progress & Performance

**File:** `supabase/migrations/004_progress.sql`

`lesson_completions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| lesson_id | UUID | FK → lessons(id) |
| completed_at | TIMESTAMPTZ | NOT NULL |
| time_spent_seconds | INTEGER | |
| score | NUMERIC(5,2) | nullable |
| created_at | TIMESTAMPTZ | |

`quiz_attempts`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| quiz_id | UUID | FK → quizzes(id) |
| started_at | TIMESTAMPTZ | NOT NULL |
| completed_at | TIMESTAMPTZ | nullable |
| score | NUMERIC(5,2) | nullable |
| passed | BOOLEAN | nullable |
| created_at | TIMESTAMPTZ | |

`question_responses`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| attempt_id | UUID | FK → quiz_attempts(id) |
| question_id | UUID | FK → questions(id) |
| user_answer | TEXT | |
| is_correct | BOOLEAN | |
| response_time_ms | INTEGER | |
| created_at | TIMESTAMPTZ | |

`game_sessions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| game_id | UUID | FK → games(id) |
| started_at | TIMESTAMPTZ | |
| ended_at | TIMESTAMPTZ | nullable |
| score | INTEGER | |
| created_at | TIMESTAMPTZ | |

---

### DB-006 · Migration 005 — Gamification

**File:** `supabase/migrations/005_gamification.sql`

`point_transactions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| amount | INTEGER | positive = earned, negative = spent |
| reason | TEXT | |
| source_type | TEXT | CHECK IN ('quiz','lesson','game','reward','manual') |
| source_id | UUID | nullable |
| created_at | TIMESTAMPTZ | |

`rewards`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | NOT NULL |
| description | TEXT | |
| point_cost | INTEGER | NOT NULL, > 0 |
| image_url | TEXT | nullable |
| is_active | BOOLEAN | DEFAULT true |
| stock | INTEGER | nullable (null = unlimited) |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

`reward_redemptions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| reward_id | UUID | FK → rewards(id) |
| redeemed_at | TIMESTAMPTZ | NOT NULL |
| points_spent | INTEGER | NOT NULL, CHECK > 0 |
| created_at | TIMESTAMPTZ | |

`leaderboard_snapshots`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| total_points | INTEGER | NOT NULL |
| rank | INTEGER | NOT NULL |
| previous_rank | INTEGER | nullable |
| period | TEXT | CHECK IN ('daily','weekly','all_time') |
| snapshot_date | DATE | NOT NULL |
| created_at | TIMESTAMPTZ | |

Unique constraint: `(user_id, period, snapshot_date)`

---

### DB-007 · Migration 006 — Activity Logs

**File:** `supabase/migrations/006_logs.sql`

`activity_logs` — immutable, append-only, no `updated_at` or `deleted_at`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id), nullable (system events) |
| action_type | TEXT | e.g. 'login', 'quiz_complete', 'export_csv' |
| entity_type | TEXT | nullable, e.g. 'quiz', 'lesson' |
| entity_id | UUID | nullable |
| metadata | JSONB | arbitrary context |
| ip_address | INET | nullable |
| created_at | TIMESTAMPTZ | NOT NULL |

---

### DB-008 · Migration 007 — Aggregation Stats Tables

**File:** `supabase/migrations/007_stats.sql`

Regular tables populated by scheduled functions (not materialized views).

`daily_user_stats` — PK: `date`:

| Column | Type |
|---|---|
| date | DATE PK |
| new_registrations | INTEGER |
| active_users | INTEGER |
| total_sessions | INTEGER |
| updated_at | TIMESTAMPTZ |

`daily_content_stats` — PK: `(date, subject_id)`:

| Column | Type |
|---|---|
| date | DATE |
| subject_id | UUID FK → subjects |
| lessons_completed | INTEGER |
| quizzes_taken | INTEGER |
| avg_score | NUMERIC(5,2) |
| updated_at | TIMESTAMPTZ |

`daily_gamification_stats` — PK: `date`:

| Column | Type |
|---|---|
| date | DATE PK |
| points_awarded | INTEGER |
| points_redeemed | INTEGER |
| rewards_redeemed | INTEGER |
| active_leaderboard_users | INTEGER |
| updated_at | TIMESTAMPTZ |

---

### DB-009 · Migration 008 — Postgres Functions

**File:** `supabase/migrations/008_functions.sql`

All functions: `SECURITY DEFINER`, explicit `search_path = public`, inline SQL comments, owned by `postgres`.

1. `get_user_role()` — returns current user's role from `user_profiles` where `auth_user_id = auth.uid()` and `deleted_at IS NULL` and `is_active = true`.

2. `teacher_can_access_student(p_student_id UUID)` — returns true when the current teacher is assigned to at least one active class where the student is actively enrolled.

3. `compute_leaderboard_snapshot(p_period TEXT, p_date DATE)` — recalculates rankings for period, upserts into `leaderboard_snapshots` with `previous_rank` from prior snapshot.

4. `refresh_daily_stats(p_date DATE)` — aggregates data for given date and upserts into all three `daily_*_stats` tables.

5. `get_cohort_retention(p_cohort_weeks INTEGER)` — returns cohort × retention day (1/7/14/30/60/90) matrix as JSON array.

6. `flag_churn_risk(p_inactive_days INTEGER)` — returns `user_id`s of previously active users with no activity in last N days.

---

### DB-010 · Migration 009 — RLS Policies

**File:** `supabase/migrations/009_rls.sql`

Enable RLS on every table. Policy naming: `{table}_{role}_{operation}`.

| Table | super_admin | content_manager | teacher | viewer | student |
|---|---|---|---|---|---|
| user_profiles | ALL | SELECT | SELECT self + assigned students | SELECT | SELECT self |
| classrooms | ALL | ALL | SELECT assigned | SELECT | SELECT enrolled |
| teacher_class_assignments | ALL | SELECT | SELECT own | NONE | NONE |
| student_class_enrollments | ALL | SELECT | SELECT assigned students' | NONE | SELECT own |
| subjects | ALL | ALL | SELECT | SELECT | SELECT enrolled |
| lessons | ALL | ALL | SELECT | SELECT | SELECT published enrolled |
| quizzes | ALL | ALL | SELECT | SELECT | SELECT published enrolled |
| questions | ALL | ALL | SELECT | SELECT | SELECT via accessible quiz |
| games | ALL | ALL | SELECT | SELECT | SELECT published enrolled |
| lesson_completions | ALL | SELECT | SELECT assigned students | NONE | SELECT/INSERT own |
| quiz_attempts | ALL | SELECT | SELECT assigned students | NONE | SELECT/INSERT own |
| question_responses | ALL | SELECT | SELECT assigned students via attempt | NONE | SELECT/INSERT own |
| game_sessions | ALL | SELECT | SELECT assigned students | NONE | SELECT/INSERT own |
| point_transactions | ALL | SELECT | SELECT assigned students | NONE | SELECT own |
| rewards | ALL | ALL | SELECT | SELECT | SELECT |
| reward_redemptions | ALL | SELECT | SELECT assigned students | NONE | SELECT/INSERT own |
| leaderboard_snapshots | ALL | SELECT | SELECT | SELECT | SELECT |
| activity_logs | ALL | SELECT | SELECT own + assigned student events | NONE | SELECT own |
| daily_user_stats | ALL | SELECT | NONE | NONE | NONE |
| daily_content_stats | ALL | SELECT | SELECT assigned class subjects | NONE | NONE |
| daily_gamification_stats | ALL | SELECT | NONE | NONE | NONE |

Teacher "assigned students" = students actively enrolled in at least one active class assigned to the teacher via `teacher_class_assignments` + `student_class_enrollments`. Sharing a subject is not sufficient.

---

### DB-011 · Migration 010 — Performance Indexes

**File:** `supabase/migrations/010_indexes.sql`

```sql
-- Users
CREATE INDEX idx_user_profiles_auth_user  ON user_profiles(auth_user_id);
CREATE INDEX idx_user_profiles_role       ON user_profiles(role);
CREATE INDEX idx_user_profiles_active     ON user_profiles(is_active, created_at DESC);
CREATE INDEX idx_classrooms_subject       ON classrooms(subject_id);
CREATE INDEX idx_teacher_class_teacher    ON teacher_class_assignments(teacher_id, classroom_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_class_student    ON student_class_enrollments(student_id, classroom_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_class_classroom  ON student_class_enrollments(classroom_id, student_id) WHERE deleted_at IS NULL;

-- Content
CREATE INDEX idx_lessons_subject          ON lessons(subject_id);
CREATE INDEX idx_quizzes_subject          ON quizzes(subject_id);
CREATE INDEX idx_questions_quiz           ON questions(quiz_id);

-- Progress
CREATE INDEX idx_lesson_comp_user_date   ON lesson_completions(user_id, completed_at DESC);
CREATE INDEX idx_lesson_comp_lesson      ON lesson_completions(lesson_id, completed_at DESC);
CREATE INDEX idx_quiz_att_user_date      ON quiz_attempts(user_id, completed_at DESC);
CREATE INDEX idx_quiz_att_quiz           ON quiz_attempts(quiz_id);
CREATE INDEX idx_question_resp_attempt   ON question_responses(attempt_id);
CREATE INDEX idx_question_resp_question  ON question_responses(question_id, is_correct);

-- Gamification
CREATE INDEX idx_point_tx_user           ON point_transactions(user_id, created_at DESC);
CREATE INDEX idx_point_tx_source         ON point_transactions(source_type, created_at DESC);
CREATE INDEX idx_leaderboard_period      ON leaderboard_snapshots(period, snapshot_date DESC, rank ASC);
CREATE INDEX idx_reward_redeem_user      ON reward_redemptions(user_id, redeemed_at DESC);

-- Logs
CREATE INDEX idx_activity_user_date      ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_date           ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_action_date    ON activity_logs(action_type, created_at DESC);
```

---

### DB-012 · Seed Data

**File:** `supabase/seed.sql`

- 5 subjects: Mathematics, Science, Arabic, English, History
- Per subject: 4 lessons (mix of types), 2 quizzes, 10 questions per quiz, 1 game
- Users: 1 super admin (`admin@eduquest.dev`), 2 content managers, 5 teachers, 100 students
- Classes: 10+ active classrooms, teacher assignments for every classroom, each student in 1–3 classes
- 30 days of synthetic activity: completions, quiz attempts + responses, game sessions, point transactions, reward redemptions, activity logs
- Initial leaderboard snapshots for all three periods
- Daily stats tables populated for all 30 days
- All inserts: `ON CONFLICT DO NOTHING` (idempotent)
- Seed admin password documented in `README.md` only

---

---

# AREA 2 — BACKEND

> Next.js Route Handlers, Supabase query functions, auth layer, middleware, export pipeline.
> All server-side logic. No UI. Consumed by Area 3 (frontend).

---

## Phase 0B · Backend Bootstrap

### BE-001 · Project scaffold and dependencies
- Init Next.js 15 app with App Router, TypeScript strict, Tailwind v4
- Install all dependencies per Constitution §2 stack table
- Configure `tsconfig.json` with `@/*` path alias
- Configure ESLint + Prettier
- Set up `.env.local` from template
- Confirm `next build` exits 0 on empty scaffold

---

### BE-002 · Supabase client helpers
**Files:** `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`

- `createServerClient` — cookie-based, for Server Components and Route Handlers
- `createBrowserClient` — singleton, for Client Components (realtime + mutations only)
- `createMiddlewareClient` — for `middleware.ts` session refresh
- All typed, re-export the Supabase client type

---

### BE-003 · Auth middleware
**File:** `middleware.ts`

- Runs on every `/(dashboard)/:path*` request
- Refreshes session on every request (Supabase PKCE requirement)
- No valid session → redirect to `/login`
- Insufficient role for route → redirect to `/dashboard/overview?error=unauthorized`
- Attaches user role to request headers for downstream use

---

### BE-004 · TypeScript types
**Files:** `lib/types/database.ts`, `lib/types/index.ts`

- `database.ts`: generated via `supabase gen types typescript --local`
- `index.ts` domain types: `UserProfile`, `UserRole`, `UserWithStats`, `Classroom`, `TeacherClassAssignment`, `StudentClassEnrollment`, `Subject`, `Lesson`, `Quiz`, `Question`, `Game`, `LessonCompletion`, `QuizAttempt`, `QuestionResponse`, `PointTransaction`, `Reward`, `RewardRedemption`, `LeaderboardEntry`, `ActivityLog`, `DateRange`, `PaginatedResult<T>`, `ReportFilter`, `KpiSnapshot`, `UserGrowthPoint`, `SubjectEngagement`, `CohortRetentionMatrix`, `ContentFunnelStep`, `QuestionDifficulty`

---

### BE-005 · GitHub Actions CI
**File:** `.github/workflows/ci.yml`

- Trigger: every PR to `main`
- Steps: `npm ci` → `tsc --noEmit` → `eslint .` → `next build`
- Railway auto-deploys `main` via native Next.js buildpack (no Dockerfile)
- Comment: `# FUTURE: Add Dockerfile for multi-service or custom runtime needs`

---

## Phase 2 · Backend Core

### BE-006 · Overview queries
**File:** `lib/queries/overview.ts`

- `getKpiSnapshot(dateRange)` — total users, active today, lessons completed today, points awarded today
- `getUserGrowthSeries(dateRange, granularity)` — new registrations per day/week/month
- `getTopSubjects(dateRange, limit)` — top N subjects by engagement score

---

### BE-007 · User queries
**File:** `lib/queries/users.ts`

- `getUsers(params)` — paginated, filterable (role, grade, status, search), sortable
- `getUserById(id)` — single user with full stats
- `getUserActivityTimeline(userId, limit)`
- `getUserQuizHistory(userId, params)`
- `getUserLessonHistory(userId, params)`
- `getUserPointsHistory(userId, dateRange)`

---

### BE-008 · User growth & retention queries
**File:** `lib/queries/user-growth.ts`

- `getRegistrationTrend(dateRange, granularity)`
- `getCohortRetention(cohortWeeks)` — calls `get_cohort_retention()` Postgres function
- `getRoleDistribution()`
- `getChurnRiskUsers(inactiveDays, limit)` — calls `flag_churn_risk()` Postgres function

---

### BE-009 · Content queries
**File:** `lib/queries/content.ts`

- `getSubjectOverview()` — per subject: lesson count, quiz count, avg completion rate, avg score
- `getSubjectScoreMatrix(dateRange)` — subject × week matrix for heatmap
- `getCompletionFunnel(subjectId?)` — started/completed/passed counts
- `getHardestQuestions(params)` — sorted by error rate
- `getLessonEngagementScores()` — per lesson 0–100 score
- `getDropoffData(lessonId)` — % drop-off per lesson segment

---

### BE-010 · Gamification queries
**File:** `lib/queries/gamification.ts`

- `getLeaderboard(period, limit)` — with rank change from previous snapshot
- `getPointsTimeline(dateRange)` — awarded vs redeemed per day
- `getTopEarners(period, limit)`
- `getPointsBySource(dateRange)` — breakdown by source_type
- `getRewardStats(dateRange)` — redemptions per reward + trend
- `getEngagementFunnel()` — earned → checked leaderboard → redeemed

---

### BE-011 · Activity log queries
**File:** `lib/queries/activity-logs.ts`

- `getActivityLogs(params)` — filterable by user, action_type[], date range; paginated 25/page
- `logAction(entry)` — internal utility used by all Route Handlers

---

### BE-012 · Auth server actions
**File:** `app/(auth)/login/actions.ts`

- `loginAction(formData)` — `signInWithPassword`, set session cookie, redirect to overview
- `logoutAction()` — `signOut`, clear cookie, redirect to login
- Both are Next.js Server Actions (not Route Handlers)

---

### BE-018 · Realtime server configuration

- Confirm Realtime enabled for `activity_logs` INSERT and `leaderboard_snapshots` changes
- Confirm Realtime payloads respect RLS per role
- Document channel names and filters consumed by frontend hooks
- Add integration notes for presence channel `admin-presence`

---

## Phase 4 · Backend Features

### BE-013 · Report preview API
**File:** `app/api/reports/preview/route.ts`

- `POST` body: `{ reportType, dateRange, filters }`
- Validates session + role (`content_manager` or `super_admin`)
- Returns first 50 rows as `{ columns: string[], rows: Record<string, unknown>[] }`
- `400` unknown type, `403` insufficient role, logs to `activity_logs`
- Types: `user_growth`, `learning_performance`, `gamification_summary`, `activity_log`, `question_difficulty`

---

### BE-014 · CSV export Route Handler
**File:** `app/api/reports/export/route.ts` (CSV branch)

- `GET` params: `reportType`, `format=csv`, `from`, `to`, plus report-specific filters
- Streams full dataset via `ReadableStream` — no row limit
- `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="eduquest-{type}-{date}.csv"`
- UTF-8 with BOM, ISO 8601 dates, unformatted numbers
- Logs to `activity_logs` with `action_type: 'export_csv'`

---

### BE-015 · PDF export Route Handler
**File:** `app/api/reports/export/route.ts` (PDF branch) + `lib/pdf/ReportTemplate.tsx`

- `GET` params: `format=pdf`
- 500-row max — returns `400 { error: 'Use CSV for datasets over 500 rows' }` if exceeded
- Generates PDF server-side using `@react-pdf/renderer`
- PDF includes: EduQuest logo placeholder, report title, date range, generated-by email, generated-at UTC
- Logs to `activity_logs` with `action_type: 'export_pdf'`

---

### BE-016 · Admin user management routes
**Files:** `app/api/admin/invite/route.ts`, `app/api/admin/roles/route.ts`, `app/api/users/[id]/deactivate/route.ts`

- `POST /api/admin/invite` — `admin.inviteUserByEmail`, insert `user_profiles` with role. Super Admin only.
- `PATCH /api/admin/roles` — `{ userId, newRole }`. Updates role. Super Admin only.
- `POST /api/users/[id]/deactivate` — `is_active = false`, revoke session. Super Admin only.
- All: validate session, assert role, log to `activity_logs`.

---

### BE-017 · Vault / API key management route
**File:** `app/api/admin/vault/route.ts`

- `GET` — list key names (not values). Super Admin only.
- `GET ?reveal=true&key=name` — masked value (first 8 chars + `••••••••`). Super Admin only.
- `POST { keyName }` — generate + store in Vault, log rotation. Super Admin only.
- Uses `SUPABASE_SERVICE_ROLE_KEY` (server-only).

---

---

# AREA 3 — FRONTEND

> All UI: pages, components, charts, forms, layouts.
> Built with Antigravity (Gemini). Build with mock data (conforming to BE-004 types), wire in Phase 6.

---

## Phase 0B · Frontend Bootstrap

### FE-001 · App shell and routing structure
**Files:** `app/layout.tsx`, `app/(auth)/layout.tsx`, `app/(dashboard)/layout.tsx`

- Root: font (Inter or Geist), global CSS, metadata `title: 'EduQuest Admin'`
- Auth layout: centered card, no sidebar
- Dashboard layout: two-column (sidebar + main), top header strip

---

### FE-002 · Sidebar navigation
**File:** `components/shared/Sidebar.tsx`

| Label | Route | Icon | Visible to |
|---|---|---|---|
| Overview | `/dashboard/overview` | LayoutDashboard | All |
| Users | `/dashboard/users` | Users | All |
| Content | `/dashboard/content` | BookOpen | All |
| Gamification | `/dashboard/gamification` | Trophy | All |
| Reports | `/dashboard/reports` | FileText | super_admin, content_manager |
| Activity Logs | `/dashboard/activity-logs` | ScrollText | super_admin, content_manager |
| Settings | `/dashboard/settings` | Settings | super_admin only |

Active route highlighted. Collapsible to icons at ≤ 1280px. Hidden + hamburger at ≤ 768px. Bottom: avatar, display name, role badge, logout.

---

### FE-003 · Top header
**File:** `components/shared/Header.tsx`

- Left: hamburger (mobile) + dynamic page title
- Right: date range picker (URL params `?from=&to=`) + user avatar dropdown
- Presets: Last 7 / 30 / 90 days, Last year, Custom

---

### FE-004 · Login page
**File:** `app/(auth)/login/page.tsx`

EduQuest logo + "Admin Dashboard" subtitle. Email + password. Calls `loginAction`. Inline error, no page reload. Loading state on submit. No forgot-password in v1.

---

### FE-005 · Shared UI primitives
**Files:** `components/shared/KpiCard.tsx`, `DataTable.tsx`, `DateRangePicker.tsx`, `PageHeader.tsx`, `EmptyState.tsx`, `ErrorBoundary.tsx`

- **KpiCard:** `label`, `value`, `trend?`, `icon`, `isLoading`. Skeleton on loading. Green ↑ / red ↓ / gray — trend. ARIA `role="region"`.
- **DataTable:** TanStack Table + Virtual. `columns`, `data`, `isLoading`, `pagination`, `onPageChange`. Skeleton rows. Empty state slot.
- **PageHeader:** title + optional subtitle + action slot.
- **EmptyState:** icon + heading + description + optional CTA.
- **ErrorBoundary:** "Something went wrong" card + retry button.

---

### FE-006A · Realtime hooks
**Files:** `lib/hooks/useRealtimeSubscription.ts`, `useLeaderboard.ts`, `useActivityFeed.ts`, `useActiveUsers.ts`

- `useRealtimeSubscription(table, filter, callback)` — generic, manages lifecycle
- `useLeaderboard(period)` — subscribes to `leaderboard_snapshots`, re-subscribes on period change
- `useActivityFeed(limit)` — subscribes to `activity_logs` INSERT, prepends events up to limit
- `useActiveUsers()` — presence channel `admin-presence`, returns count
- All: unsubscribe on unmount, graceful error handling (stale data, not empty)

---

## Phase 2.5 · Integration Check

### IC-001 · Wire Overview page to live backend

- Replace Overview page mock data with real backend query calls
- Confirm all 4 KPI cards render with live data
- Confirm RLS: teacher scope limited to their students; viewer sees aggregates only
- Confirm Realtime presence counter connects
- Document + fix any type mismatches vs `lib/types/index.ts`

**Exit criteria:** Overview works end-to-end on staging. Zero type mismatches. Zero RLS gaps. Do not proceed to Phase 3 until this passes.

---

## Phase 3 · Frontend Core

### FE-007 · User Growth Chart
**File:** `components/charts/UserGrowthChart.tsx`

Recharts `AreaChart`, `ResponsiveContainer`. Toggle: Daily / Weekly / Monthly. Adaptive X-axis date labels. Integer Y-axis. Gradient fill. Tooltip. Skeleton on load.

---

### FE-008 · Subject Engagement Bar Chart
**File:** `components/charts/SubjectEngagementBar.tsx`

Recharts `BarChart`, horizontal. Top 5 subjects by engagement score. Each bar coloured by subject `color_hex`. Score label at bar end. Skeleton on load.

---

### FE-009 · Realtime widgets
**Files:** `components/realtime/ActiveUsersCounter.tsx`, `LiveLeaderboard.tsx`, `ActivityFeed.tsx`

- **ActiveUsersCounter:** `useActiveUsers()`. Pulsing green dot + count. Fallback "–".
- **LiveLeaderboard:** `useLeaderboard('weekly')`. Top 10: rank, rank change badge, avatar, name, points. Brief flash on update. "View full leaderboard →" link.
- **ActivityFeed:** `useActivityFeed(20)`. Coloured action icon + user + action + relative time. Slide-in on new event.

---

### FE-006 · Overview page
**File:** `app/(dashboard)/overview/page.tsx`

Desktop layout: 4 KPI cards → 2-col (growth chart + subjects bar) → 3-col (active users + leaderboard + feed). Server Component fetches KPI + growth + subjects. Each section in `<Suspense>` with skeleton. Realtime sections are Client Components.

---

### FE-010 · Users section layout
**File:** `app/(dashboard)/users/layout.tsx`

Tab nav: User List | Growth & Retention. Teachers see User List only (scoped to assigned students).

---

### FE-013 · Cohort Retention Heatmap
**File:** `components/charts/RetentionHeatmap.tsx`

Custom SVG grid: cohort weeks (rows) × Day 1/7/14/30/60/90 (columns). Teal colour scale 0%→100%. Hover tooltip. Legend colour bar. ARIA `role="img"` + per-cell `aria-label`.

---

### FE-011 · User list page
**File:** `app/(dashboard)/users/page.tsx`

Filter bar: search (300ms debounce), role multiselect, grade select, status toggle — all sync to URL params. `DataTable`: avatar+name, role badge, grade, last active, total points, status pill, actions menu. Actions: View profile, Deactivate (confirm dialog, super_admin only). 25/page server pagination. Sort: name, last active, total points.

---

### FE-012 · User growth & retention page
**File:** `app/(dashboard)/users/growth/page.tsx`

Four sections in order: Registration Trend (FE-007 reused) → Cohort Retention Heatmap (FE-013) → Role Distribution (Recharts PieChart + legend) → Churn Risk table (name, last active, days inactive).

---

### FE-014 · User detail page
**File:** `app/(dashboard)/users/[id]/page.tsx`

Header: avatar, name, role badge, status, Deactivate (super_admin). Stats row: 4 KpiCards. Tabs: Overview (weekly points line chart) | Quiz History (paginated table) | Lesson History (paginated table) | Points & Rewards (transaction timeline) | Activity Log (last 50).

---

## Phase 5 · Frontend Features

### FE-015 · Content overview page
**File:** `app/(dashboard)/content/page.tsx`

Subject filter dropdown. Subject cards grid (3→2→1 col): icon, name, lesson count, quiz count, completion rate ring, avg score badge. Content status table below: title, type badge, subject, published/draft, completions, avg score. Filterable by type/status, sortable by completions/avg score.

---

### FE-016 · Content performance analytics page
**File:** `app/(dashboard)/content/performance/page.tsx`

Four charts: Subject Score Heatmap (same SVG pattern as FE-013) → Completion Funnel (Started/Completed/Passed) → Lesson Engagement Scores bar chart (green ≥70, amber 40–69, red <40) → Drop-off Points area chart.

---

### FE-017 · Question difficulty analysis page
**File:** `app/(dashboard)/content/questions/page.tsx`

Hardest Questions panel: top 10 by error rate as ranked cards (rank, excerpt, quiz name, error rate % in red if >60%). Full question table: excerpt, quiz, subject, error rate %, avg response time ms, skip rate %, difficulty score. Default sort: error rate desc. 50/page. Subject + quiz filters.

---

### FE-018 · Gamification hub page
**File:** `app/(dashboard)/gamification/page.tsx`

Four nav cards: Leaderboard, Points Economy, Rewards, Engagement Funnel. Each card shows a top-line metric (current #1, total points this week, top reward name, funnel conversion %).

---

### FE-019 · Realtime leaderboard page
**File:** `app/(dashboard)/gamification/leaderboard/page.tsx`

Period tabs: Daily | Weekly | All Time. Top-50 table: rank, animated rank change (↑ green / ↓ red / — gray), avatar, name, total points, points change vs previous period. Last-updated timestamp. Switching tab re-subscribes Realtime channel.

---

### FE-020 · Points economy page
**File:** `app/(dashboard)/gamification/economy/page.tsx`

Date range filter. Stacked AreaChart: awarded (solid) vs redeemed (lighter). Top 10 Earners table with source breakdown mini-bar. Points by Source donut chart (quiz/lesson/game/reward/manual). Inflation Metric line chart (avg points per active user per day).

---

### FE-021 · Rewards analytics page
**File:** `app/(dashboard)/gamification/rewards/page.tsx`

Redemptions by Reward horizontal bar chart (sorted desc). Popularity cards: top 3 (green) + bottom 3 (amber) with name, image, count, point cost. Redemptions over time line chart (top 5 rewards + "Other").

---

### FE-022 · Report builder page
**File:** `app/(dashboard)/reports/page.tsx`

Step 1: report type (5 styled cards). Step 2: date range. Step 3: dynamic secondary filters per type. "Preview" → POST preview API → render first 50 rows below. "Export CSV" / "Export PDF" → browser download. Loading spinners + inline error on all actions.

---

### FE-023 · Activity logs page
**File:** `app/(dashboard)/activity-logs/page.tsx`

Filter bar: user search (debounced), action type multiselect, date range — all sync to URL params. Table: user, action type badge (colour-coded), entity type, entity ID (truncated), timestamp (full on hover), IP. Expandable row: metadata JSONB syntax-highlighted. "Export CSV". 25/page.

---

### FE-024 · Settings layout
**File:** `app/(dashboard)/settings/layout.tsx`

Sub-nav: Admin Users | Notifications | Data Retention | API Keys. Non-super_admin → redirect to `/dashboard/overview`.

---

### FE-025 · Admin users management page
**File:** `app/(dashboard)/settings/users/page.tsx`

Invite form: email + role → `POST /api/admin/invite` → success toast. Admin table: avatar, name, email, editable role dropdown, status, Deactivate button. Role change → `PATCH /api/admin/roles` optimistic. Deactivate → confirm dialog. All actions: success/error toasts.

---

### FE-026 · API keys page
**File:** `app/(dashboard)/settings/api-keys/page.tsx`

List key names (no values). "Reveal" → masked value `sk_live_a3f9••••••••`. "Rotate" → confirm dialog → POST rotate → update display. Warning banner: "Rotating a key immediately invalidates the old one."

---

## Phase 6 · Integration

### INT-001 · Wire all frontend pages to live backend
Replace all mock data with real query calls. Verify TypeScript types align across `lib/queries/*.ts` and component props. Test all date range URL param flows.

### INT-002 · Realtime end-to-end validation
Quiz completion → activity feed updates <3s. Leaderboard recalculation → rank change animation fires. Two browser sessions → presence counter ±1 correctly.

### INT-003 · Export pipeline validation
All 5 CSV types: download, UTF-8 BOM, correct headers, correct data. PDF: layout, logo placeholder, metadata. 500-row limit: confirm `400` response. `activity_logs` entry created for every export action.

### INT-004 · RBAC end-to-end validation
All 5 roles tested. Sidebar items match permissions matrix. Route Handlers return `403` for out-of-role. RLS blocks out-of-scope data on direct Supabase queries. Teacher cannot see other teachers' students in any query.

---

## Phase 7 · Hardening

### HARD-001 · Performance audit
`React.Suspense` + skeleton audit across all pages. `next/bundle-analyzer` — no chunk >500kB. `EXPLAIN ANALYZE` on 5 slowest queries → documented in `PERFORMANCE.md`. Lighthouse LCP <2.5s on production Railway URL. `next/dynamic` for heavy Recharts bundles.

### HARD-002 · Accessibility audit
`axe-core` against all 7 main pages. Fix all critical + serious violations. Keyboard nav walkthrough on Overview. WCAG AA (4.5:1) contrast on all chart colours + badges. Sign off in `ACCESSIBILITY.md`.

### HARD-003 · Security hardening
Every Route Handler: session + role validation confirmed. `SUPABASE_SERVICE_ROLE_KEY` never in client-side code. No string-interpolated SQL. RLS bypass attempt review. Vault keys never appear in `activity_logs` metadata.

### HARD-004 · README and developer docs
**File:** `README.md`

Sections: project overview · local dev setup (`npm install` → `supabase start` → `supabase db reset` → `npm run dev`) · environment variables table · running migrations · running seed · Railway deployment · AI tooling map · seed admin credentials pattern.

---

---

# SEQUENTIAL BUILD ORDER

> One spec at a time. Complete each row fully before moving to the next.
> Do not skip rows. Do not reorder.

---

## Phase 0A — Database Bootstrap

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 1 | DB-001 | Supabase project init — Auth, RLS global deny, Realtime, CLI link, env keys | DB | Manual |

---

## Phase 0B — Dev Bootstrap

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 2 | BE-001 | Next.js 15 scaffold — App Router, TypeScript strict, Tailwind v4, all deps, ESLint, Prettier, path alias | BE | Claude Code |
| 3 | BE-002 | Supabase client helpers — `createServerClient`, `createBrowserClient`, `createMiddlewareClient` | BE | Claude Code |
| 4 | BE-003 | Auth middleware — session guard, role check, redirect logic | BE | Claude Code |
| 5 | BE-004 | TypeScript types — `database.ts` generated + all domain types in `index.ts` | BE | Claude Code |
| 6 | BE-005 | GitHub Actions CI — lint → typecheck → build | BE | Claude Code |
| 7 | FE-001 | App shell — root layout, auth layout, dashboard layout, fonts, metadata | FE | Antigravity |
| 8 | FE-002 | Sidebar navigation — role-gated links, collapse behaviour, logout | FE | Antigravity |
| 9 | FE-003 | Top header — page title, date range picker, user dropdown | FE | Antigravity |
| 10 | FE-004 | Login page — email/password form, server action, inline error, loading state | FE | Antigravity |
| 11 | FE-005 | Shared UI primitives — KpiCard, DataTable, PageHeader, EmptyState, ErrorBoundary, DateRangePicker | FE | Antigravity |
| 12 | FE-006A | Realtime hooks — `useLeaderboard`, `useActivityFeed`, `useActiveUsers`, `useRealtimeSubscription` | FE | Antigravity |

---

## Phase 1 — Database Schema

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 13 | DB-002 | Migration 001 — `user_profiles`, `role` ENUM, `updated_at` trigger | DB | Claude Code |
| 14 | DB-003 | Migration 002 — `subjects`, `classrooms`, `teacher_class_assignments`, `student_class_enrollments` | DB | Claude Code |
| 15 | DB-004 | Migration 003 — `lessons`, `quizzes`, `questions`, `games` | DB | Claude Code |
| 16 | DB-005 | Migration 004 — `lesson_completions`, `quiz_attempts`, `question_responses`, `game_sessions` | DB | Claude Code |
| 17 | DB-006 | Migration 005 — `point_transactions`, `rewards`, `reward_redemptions`, `leaderboard_snapshots` | DB | Claude Code |
| 18 | DB-007 | Migration 006 — `activity_logs` (append-only, no soft delete) | DB | Claude Code |
| 19 | DB-008 | Migration 007 — `daily_user_stats`, `daily_content_stats`, `daily_gamification_stats` | DB | Claude Code |
| 20 | DB-009 | Migration 008 — Postgres functions: `get_user_role`, `teacher_can_access_student`, `compute_leaderboard_snapshot`, `refresh_daily_stats`, `get_cohort_retention`, `flag_churn_risk` | DB | Claude Code |
| 21 | DB-010 | Migration 009 — RLS policies for all 20 tables × 5 roles | DB | Claude Code |
| 22 | DB-011 | Migration 010 — 25 performance indexes | DB | Claude Code |
| 23 | DB-012 | Seed data — 5 subjects, 10 classrooms, 5 teachers, 100 students, 30 days synthetic activity | DB | Claude Code |

---

## Phase 2 — Backend Core

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 24 | BE-006 | Overview queries — `getKpiSnapshot`, `getUserGrowthSeries`, `getTopSubjects` | BE | Claude Code |
| 25 | BE-007 | User queries — `getUsers` paginated, `getUserById`, activity/quiz/lesson/points history | BE | Claude Code |
| 26 | BE-008 | User growth & retention queries — trend, cohort matrix, role distribution, churn risk | BE | Claude Code |
| 27 | BE-009 | Content queries — subject overview, score matrix, funnel, hardest questions, engagement, dropoff | BE | Claude Code |
| 28 | BE-010 | Gamification queries — leaderboard, points timeline, top earners, by source, rewards, funnel | BE | Claude Code |
| 29 | BE-011 | Activity log queries — `getActivityLogs` paginated/filtered, `logAction()` utility | BE | Claude Code |
| 30 | BE-012 | Auth server actions — `loginAction`, `logoutAction` | BE | Claude Code |
| 31 | BE-018 | Realtime server config — confirm channels, RLS payloads, presence channel docs | BE | Claude Code |

---

## Phase 2.5 — Integration Check ✋

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 32 | IC-001 | Wire Overview page to live backend — validate KPIs, RLS per role, Realtime presence, fix all type mismatches | ALL | Manual |

> **Do not proceed to Phase 3 until IC-001 passes completely.**

---

## Phase 3 — Frontend Core

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 33 | FE-007 | User Growth Chart — Recharts AreaChart, daily/weekly/monthly toggle, gradient fill, skeleton | FE | Antigravity |
| 34 | FE-008 | Subject Engagement Bar Chart — horizontal, subject colour per bar, score label, skeleton | FE | Antigravity |
| 35 | FE-009 | Realtime widgets — `ActiveUsersCounter`, `LiveLeaderboard` top 10, `ActivityFeed` slide-in | FE | Antigravity |
| 36 | FE-006 | Overview page — 4 KPIs, growth chart, subjects bar, 3 realtime widgets, Suspense skeletons | FE | Antigravity |
| 37 | FE-010 | Users section layout — tab nav (User List / Growth & Retention), teacher scope | FE | Antigravity |
| 38 | FE-013 | Cohort Retention Heatmap — custom SVG grid, teal colour scale, tooltip, ARIA labels | FE | Antigravity |
| 39 | FE-011 | User list page — filter bar, DataTable, sort, 25/page pagination, deactivate action | FE | Antigravity |
| 40 | FE-012 | User growth & retention page — registration trend, heatmap, role distribution, churn risk | FE | Antigravity |
| 41 | FE-014 | User detail page — 5 tabs, 4 KpiCards stat row, deactivate button | FE | Antigravity |

---

## Phase 4 — Backend Features

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 42 | BE-013 | Report preview API — POST, 5 report types, returns first 50 rows | BE | Claude Code |
| 43 | BE-014 | CSV export Route Handler — streaming, UTF-8 BOM, all 5 report types, no row limit | BE | Claude Code |
| 44 | BE-015 | PDF export Route Handler — `@react-pdf/renderer`, 500-row limit, logo + metadata | BE | Claude Code |
| 45 | BE-016 | Admin user management routes — invite, role change, deactivate | BE | Claude Code |
| 46 | BE-017 | Vault / API key route — list key names, reveal masked, rotate | BE | Claude Code |

---

## Phase 5 — Frontend Features

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 47 | FE-015 | Content overview page — subject cards grid, content status table | FE | Antigravity |
| 48 | FE-016 | Content performance analytics — score heatmap, completion funnel, engagement bars, drop-off chart | FE | Antigravity |
| 49 | FE-017 | Question difficulty analysis — hardest questions panel, full difficulty table | FE | Antigravity |
| 50 | FE-018 | Gamification hub — 4 nav cards with top-line metrics | FE | Antigravity |
| 51 | FE-019 | Realtime leaderboard page — period tabs, top 50, animated rank change | FE | Antigravity |
| 52 | FE-020 | Points economy page — stacked area, top earners, by source donut, inflation line | FE | Antigravity |
| 53 | FE-021 | Rewards analytics page — redemptions bar, popularity cards, timeline | FE | Antigravity |
| 54 | FE-022 | Report builder page — 3-step builder, preview table, CSV + PDF download | FE | Antigravity |
| 55 | FE-023 | Activity logs page — filter bar, expandable rows, metadata JSON, export CSV | FE | Antigravity |
| 56 | FE-024 | Settings layout — sub-nav, super_admin gate redirect | FE | Antigravity |
| 57 | FE-025 | Admin users management — invite form, role dropdown optimistic, deactivate confirm | FE | Antigravity |
| 58 | FE-026 | API keys page — vault list, reveal masked, rotate with warning banner | FE | Antigravity |

---

## Phase 6 — Integration

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 59 | INT-001 | Wire all frontend pages to live backend — swap all mocks with real query calls, align all types | ALL | Manual |
| 60 | INT-002 | Realtime end-to-end — activity feed <3s, leaderboard animation, presence counter ±1 | ALL | Manual |
| 61 | INT-003 | Export pipeline — all 5 CSV types, PDF, 500-row limit, activity log entries confirmed | ALL | Manual |
| 62 | INT-004 | RBAC end-to-end — all 5 roles, sidebar gates, Route Handler 403s, RLS bypass attempts | ALL | Manual |

---

## Phase 7 — Hardening

| # | ID | Spec Title | Area | Tool |
|:---:|---|---|:---:|---|
| 63 | HARD-001 | Performance audit — Suspense/skeletons, bundle <500kB, EXPLAIN ANALYZE top 5, LCP <2.5s | ALL | Claude Code |
| 64 | HARD-002 | Accessibility audit — axe-core all pages, keyboard nav, WCAG AA contrast | ALL | Antigravity |
| 65 | HARD-003 | Security hardening — Route Handler audit, no service key in client, RLS bypass review | ALL | Claude Code |
| 66 | HARD-004 | README + developer docs — setup, migrations, seed, deploy, AI tooling map | ALL | Claude Code |

---

## Summary

| Phase | Specs | Area |
|---|:---:|---|
| 0A — DB Bootstrap | 1 | DB |
| 0B — Dev Bootstrap | 11 | BE + FE |
| 1 — Database Schema | 11 | DB |
| 2 — Backend Core | 8 | BE |
| 2.5 — Integration Check | 1 | ALL |
| 3 — Frontend Core | 9 | FE |
| 4 — Backend Features | 5 | BE |
| 5 — Frontend Features | 12 | FE |
| 6 — Integration | 4 | ALL |
| 7 — Hardening | 4 | ALL |
| **Total** | **66** | |

---

*Implementation Plan v2.0 — EduQuest — aligned with 00_CONSTITUTION.md*
