# Team guide

How to work on Práxis Edu without stepping on each other. Read the README first to run the app.

## 1. First setup

1. Clone the repo and run `npm install`.
2. Ask João Vitor for the Firebase values and create your own `.env` from `.env.example`
   (the `.env` file is never committed; share the values outside Git).
3. Send your Google e-mail to João Vitor so he adds you to the Firebase project (Editor).
4. `npx expo start -c` and open it in **Expo Go** (SDK 57).
5. Create your own test accounts in the app (sign up as teacher and as student). Do not reuse someone else's.

## 2. Who owns what

Each module has an owner. Change only your own files and Firebase nodes; ask the owner for anything else.

| Module | Owner | Screens | Firebase nodes |
|---|---|---|---|
| Auth, join class, profiles | Maria Alice | 17, 24, 25 (24 and 25 have a first version) | `users`, `userBadges` |
| Quizzes, activities, classroom mode | Ana Luiza | 09, 10, 14, 20, 21, 22, 23, 31 | `quizzes`, `classroomMode`, `answers` |
| Lessons, trails, duels, ranking | Maurício | 11 (first version), 12, 13, 16, 26–30 | `trails`, `lessonQuestions`, `progress`, `duels`, `weeklyRanking` |
| Classes, class panel, BioBot, base | João Vitor | 01, 03–06, 07, 08, 15, 18, 19, 33 | `classes`, `classCodes`, `teacherClasses`, `classMembers`, `botChats`, `aiUsage` |

Shared files (`src/components`, `src/theme`, `database.rules.json`): open a PR and warn the group.
`database.rules.json` is changed only by João Vitor (send him the rule you need).

## 3. Rules of the code

- Code, names, comments and docs in **English**. Text shown to the user in **Portuguese**.
- Firebase is used **only** inside `src/services/*`. Screens call service functions, never `ref()`.
- Every `onValue` is cancelled in the `useEffect` cleanup (return the unsubscribe function).
- Writes to several nodes use `update()` multi-path. Sums use `increment()`. Times use `serverTimestamp()`.
- Every screen handles **loading, empty and error** (friendly Portuguese message, see `utils/errors.js`).
- Styles with `StyleSheet.create` and tokens from `src/theme`. No loose colors.
- Touch targets of at least 44px. Follow the prototype in `docs/` closely.
- Use the shared components (`Button`, `Input`, `Card`, `Header`, `Toast`, `FadeIn`, ...). Look at
  `ClassesScreen` and `TrailsScreen` as examples of a full screen.
- Only use paths and fields from `docs/MODELAGEM_BANCO.md`. Need a new field? Tell the group and update that file.
- Do not install native modules. Use `npx expo install <package>` so versions match the SDK.

## 4. Git flow

- Never commit to `main`. One branch per task: `feat/<module>-<what>` (example: `feat/quiz-create-screen`).
- Small commits, message in the form `feat: ...`, `fix: ...`, `docs: ...`.
- Open a pull request to `main` and ask for one review before merging.
- Never commit `.env` or any API key.

## 5. Sample data

- `seed/trails.json` and `seed/lessonQuestions.json`: import in the Console (Realtime Database → ⋮ → Import JSON)
  on the `trails` and `lessonQuestions` nodes.
- Sample users, classes and answers: section 11 of `docs/MODELAGEM_BANCO.md`.
- Students only appear in a class after joining with its code, so test with two accounts
  (or two devices): the teacher creates the class, the student joins with the code.

## 6. Definition of done (PR checklist)

- [ ] Follows the prototype in `docs/`.
- [ ] Loading, empty and error states.
- [ ] Tested on a real phone, as teacher **and** as student.
- [ ] `onValue` listeners are cancelled.
- [ ] No API keys or `.env` in the diff.
- [ ] Names, functions and comments in English; interface text in Portuguese.
