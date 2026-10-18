# Student Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace student placeholders with working Profile, Ranking, Classroom and Duels flows using the existing Firebase schema and the visual language in `docs/Estudante.dc.html`.

**Architecture:** Keep Firebase calls in focused services and deterministic selection/scoring in pure feature modules. Screens subscribe to live data, show explicit loading/empty/error states, and perform only user-authorized writes. Reuse current Expo Router tab and stack routes.

**Tech Stack:** Expo 57, React Native 0.86, Expo Router, Firebase Realtime Database, Node test runner.

---

## File map

- `src/features/student/rankingModel.js`: normalize and sort weekly ranking, calculate position and next target.
- `src/services/rankingService.js`: limited Firebase ranking subscription.
- `src/screens/student/RankingScreen.js`: podium, list, current-user position and no-class/no-points states.
- `src/constants/badges.js`: badge catalog matching the database model.
- `src/services/badgeService.js`: user badge subscription and idempotent unlock writes.
- `src/screens/student/StudentProfileScreen.js`: profile stats, class navigation, badges and logout.
- `src/features/student/classroomModel.js`: select published quiz questions, score submitted picks, active-time eligibility.
- `src/services/classroomStudentService.js`: live room/quiz/own answer and one-time answer submission.
- `src/screens/student/ClassroomScreen.js`: waiting, timed quiz, review/submitted states.
- `src/features/student/duelModel.js`: deterministic duel status, turn and score rules.
- `src/services/duelService.js`: list/create/play/claim operations constrained to a member's own nodes.
- `src/screens/student/DuelsScreen.js` and `src/app/student/duel/*`: list, challenge, play and result UI.
- `tests/student-pages.test.mjs`: domain regression tests.

## Tasks

### Task 1: Ranking domain and backend

- [ ] Add a failing test in `tests/student-pages.test.mjs` asserting `rankingRows({a:{name:'Ana',points:25},b:{name:'Bia',points:30}},'a')` returns Bia first and Ana at position 2.
- [ ] Run `node --experimental-default-type=module tests/student-pages.test.mjs`; expect missing module/function.
- [ ] Implement `rankingRows` with `Object.entries`, descending numeric `points`, deterministic name tie-break, and `isMe`.
- [ ] Add `listenWeeklyRanking(classId, weekId, onData, onError)` using `query(ref(db,...), orderByChild('points'), limitToLast(50))`.
- [ ] Run the test again; expect pass.

### Task 2: Ranking UI

- [ ] Replace `RankingScreen` placeholder with a live list using `useAuth`, `getClass`, `listenWeeklyRanking`, `getWeekId`, `FlatList`, and `EmptyState` retry.
- [ ] Display podium only for available positions; show current-user position and points gap using domain output, not fabricated sample values.
- [ ] Run `npx expo lint` and `npx tsc --noEmit`; expect no new errors.

### Task 3: Profile and badges

- [ ] Add failing tests for badge qualification: `first_lesson` after one unique lesson, `streak_7` after seven days, and `cytology_master` only with all unit lessons at 3 stars.
- [ ] Implement pure qualification in `src/features/student/badgeModel.js` and catalog in `src/constants/badges.js`; rerun tests to green.
- [ ] Implement `listenBadges` and `unlockBadges` under `userBadges/${uid}` with idempotent writes, then render live profile stats, badge states, class link and logout in `StudentProfileScreen`.
- [ ] Run test suite, lint and typecheck.

### Task 4: Classroom domain and backend

- [ ] Add failing tests for published-question ordering, pick scoring and expired-room refusal.
- [ ] Implement pure helpers in `classroomModel.js`; rerun tests to green.
- [ ] Implement `classroomStudentService.js` with a live classroom-mode subscription, quiz lookup and own-answer subscription. Submit under `answers/${classId}/${quizId}/${uid}` with transaction or a rules-protected one-time write, using the database's required fields.
- [ ] Add a server-time offset check and enforce `quizId`, active status and deadline before submission; rerun tests.

### Task 5: Classroom UI

- [ ] Replace placeholder with waiting state, timer, question-by-question selection, review, final submit and saved-answer state. Place the primary action at the bottom, keep each option at least 48dp tall, and offer retry on network errors.
- [ ] Run test suite, lint, typecheck and Android export.

### Task 6: Duel domain and backend

- [ ] Add failing tests for challenger/opponent turn, five-question scoring, winner/draw result and one-time reward eligibility.
- [ ] Implement `duelModel.js`; rerun tests to green.
- [ ] Implement Firebase member-scoped list/create/play/result/claim operations. Writes must only touch the acting student's permitted paths; reward points go only to that student's `weeklyRanking` row.
- [ ] Rerun tests and inspect `database.rules.json` against every write path.

### Task 7: Duel UI

- [ ] Replace placeholder with live list, challenge colleague selection, play flow and result. Add routes under `src/app/student/duel/` so stack navigation is explicit.
- [ ] Show challenge/no-class/no-duel, waiting-for-opponent and network recovery states.
- [ ] Run test suite, lint, typecheck and Android export; inspect `git diff --check`.

### Task 8: Cross-screen polish

- [ ] Recheck `MyClassScreen` and `BioBotScreen` for reloads, class deletion, empty/error recovery, touch targets and consistent hierarchy.
- [ ] Verify all five student tabs and profile/class links on a device or clearly report that device testing remains.

## Boundaries

No new dependencies or Firebase deployment without review. Do not invent sample ranking/duel participants. The database may be empty; empty states are a supported outcome. Preserve the dirty worktree and do not commit unrelated changes.

## Execution note

The Profile, Ranking, Classroom and Duels code paths were implemented in this workspace, including the Firebase services and rule changes. Domain tests, lint, typecheck and Expo export are the automated gates. Publishing `database.rules.json` and testing a live teacher/student pair remain environment-dependent verification steps; they are not implied by a successful bundle export.
