import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingView } from '../components';
import JoinClassScreen from '../screens/student/JoinClassScreen';

export default function JoinClassRoute() {
  const { user, profile, loading } = useAuth();
  const [welcome, setWelcome] = useState(null);
  if (loading || (user && !profile)) return <LoadingView message="Carregando..." />;
  if (!user) return <Redirect href="/auth" />;
  if (profile.role === 'teacher') return <Redirect href="/teacher/classes" />;
  if (profile.classId && !welcome) return <Redirect href="/student/trails" />;
  return <JoinClassScreen
    welcome={welcome}
    onJoining={setWelcome}
    onJoinFailed={() => setWelcome(null)}
    onContinue={() => { setWelcome(null); router.replace('/student/trails'); }}
  />;
}
