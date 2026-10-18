import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingView } from '../components';

export default function Index() {
  const { user, profile, loading } = useAuth();
  if (loading || (user && !profile)) return <LoadingView message="Carregando..." />;
  if (!user) return <Redirect href="/auth" />;
  if (profile.role === 'teacher') return <Redirect href="/teacher/classes" />;
  return <Redirect href={profile.classId ? '/student/trails' : '/join-class'} />;
}
