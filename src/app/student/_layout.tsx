import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components';
import useClassGuard from '../../navigation/useClassGuard';
import useReducedMotion from '../../hooks/useReducedMotion';

export default function StudentLayout() {
  const reduceMotion = useReducedMotion();
  const { user, profile, loading } = useAuth();
  const checkingClass = useClassGuard(user?.uid, profile);
  if (loading || (user && !profile) || checkingClass) return <LoadingView message="Carregando..." />;
  if (!user) return <Redirect href="/auth" />;
  if (profile.role === 'teacher') return <Redirect href="/teacher/classes" />;
  if (!profile.classId) return <Redirect href="/join-class" />;
  return <Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'fade_from_bottom', animationDuration: 240 }} />;
}
