import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components';
import useReducedMotion from '../../hooks/useReducedMotion';

export default function AuthLayout() {
  const reduceMotion = useReducedMotion();
  const { user, profile, loading } = useAuth();
  if (loading || (user && !profile)) return <LoadingView message="Carregando..." />;
  if (user) return <Redirect href={profile.role === 'teacher' ? '/teacher/classes' : profile.classId ? '/student/trails' : '/join-class'} />;
  return <Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'fade', animationDuration: 220 }} />;
}
