import { router } from 'expo-router';

const staticRoutes = {
  Splash: '/auth', Login: '/auth/login', Signup: '/auth/signup', ForgotPassword: '/auth/forgot-password',
  Classes: '/teacher/classes', Profile: '/teacher/profile', CreateQuiz: '/teacher/create-quiz', Attendance: '/teacher/attendance',
  StudentProfile: '/student/profile', MyClass: '/student/my-class',
  Trails: '/student/trails', Duels: '/student/duels', Classroom: '/student/classroom',
  BioBot: '/student/biobot', Ranking: '/student/ranking',
};

export function useScreenNavigation() {
  return {
    navigate(name, params = {}) {
      if (name === 'TeacherTabs') {
        router.replace({ pathname: '/teacher/classes', params: params.params ?? {} });
        return;
      }
      if (name === 'ClassForm') {
        router.push(params.classId ? { pathname: '/teacher/class/[classId]/edit', params: { classId: params.classId } } : '/teacher/class/new');
        return;
      }
      if (name === 'ClassPanel') {
        router.push({ pathname: '/teacher/class/[classId]', params });
        return;
      }
      if (name === 'Lesson') {
        router.push({ pathname: '/student/lesson/[lessonId]', params });
        return;
      }
      if (staticRoutes[name]) router.navigate({ pathname: staticRoutes[name], params });
    },
    goBack() { router.back(); },
    setParams(params) { router.setParams(params); },
  };
}
