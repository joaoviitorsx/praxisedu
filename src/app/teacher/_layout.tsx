import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components';
import useReducedMotion from '../../hooks/useReducedMotion';

export default function TeacherLayout() {
  const reduceMotion = useReducedMotion();
  const { user, profile, loading } = useAuth();
  if (loading || (user && !profile)) return <LoadingView message="Carregando..." />;
  if (!user) return <Redirect href="/auth" />;
  if (profile.role !== 'teacher') return <Redirect href={profile.classId ? '/student/trails' : '/join-class'} />;
  return <Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'slide_from_right', animationDuration: 240, gestureEnabled: true, fullScreenGestureEnabled: true, animationMatchesGesture: true }} />;
}
