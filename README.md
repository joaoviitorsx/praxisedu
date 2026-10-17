# Práxis Edu

Gamified Biology app for high school (Duolingo + Perguntados style), built for the
*Desenvolvimento para Plataforma Móvel* course at UNIFOR. Two profiles: **teacher** and **student**.

## Stack

- Expo (SDK 58) + React Native, JavaScript, runs on **Expo Go** (iOS and Android)
- Firebase JS SDK: Authentication + Realtime Database (login persisted with AsyncStorage)
- React Navigation (native stack + bottom tabs)
- `react-native-svg` for the logo and icons, Plus Jakarta Sans font
- Gemini API through `fetch` (REST `generateContent`)

## How to run

```bash
npm install
cp .env.example .env     # then fill in your Firebase and Gemini values
npx expo start
```

Open the Expo Go app on your phone and scan the QR code (phone and computer on the same Wi-Fi).

### Firebase setup

1. Create a Firebase project with **Authentication (Email/Password)** and **Realtime Database**.
2. Copy the web app config into `.env` (see `.env.example`).
3. Paste `database.rules.json` into Console → Realtime Database → Rules.
4. (Optional) Import sample content: Realtime Database → ⋮ on the `trails` node → *Import JSON* with
   `seed/trails.json` (same for `lessonQuestions` with `seed/lessonQuestions.json`). To import a node that
   does not exist yet, import the file at the root and move it, or create an empty node first.
   Sample users and classes are in section 11 of `docs/MODELAGEM_BANCO.md`.

New to the team? Read [CONTRIBUTING.md](CONTRIBUTING.md) (setup, ownership, code rules, Git flow).

## Folder structure

```
src/
  config/        firebase.js
  theme/         colors, fonts, spacing, radius
  components/    Button, Input, Card, Chip, Screen, Header, EmptyState, ConfirmModal, Logo, LoadingView
  contexts/      AuthContext (user + profile)
  navigation/    AppNavigator, TeacherTabs, StudentTabs
  screens/       auth/  teacher/  student/
  services/      all Firebase access (screens never call ref() directly)
  utils/         dates.js, metrics.js
  constants/     topics.js, gamification.js
docs/            design system, prototype and database modeling
database.rules.json
```

## Who owns what

| Module | Owner |
|---|---|
| Login, sign up, password reset, join class, profiles | Maria Alice |
| Create quiz, activities, classroom mode | Ana Luiza |
| Trails, duels, ranking | Maurício |
| Classes (teacher), class panel, BioBot, base project | João Vitor |

### Status

- Phase 1: base project (theme, components, Firebase, auth context, navigation)
- Phase 2: teacher classes (list, create/edit, share code, cascade delete)
- Phase 3: class panel (students, performance), student "Minha Turma", deleted-class check
- Phase 4: BioBot chat with Gemini, daily AI limit, `generateQuestions()` for quizzes

`aiService.generateQuestions(topic, count)` returns questions in the standard format. Call
`chatService.consumeAiQuota(uid, 'generateCount', AI_DAILY_LIMIT.generate)` before using it.

Screens still owned by teammates are placeholders ("Em construção"). Login, sign up and
password reset (screens 03, 04, 05) are already implemented from the prototype.
