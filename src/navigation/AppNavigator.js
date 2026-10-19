import { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { LoadingView } from '../components';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import JoinClassScreen from '../screens/student/JoinClassScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import LessonScreen from '../screens/student/LessonScreen';
import MyClassScreen from '../screens/student/MyClassScreen';
import ClassFormScreen from '../screens/teacher/ClassFormScreen';
import ClassPanelScreen from '../screens/teacher/ClassPanelScreen';
import useClassGuard from './useClassGuard';
import TeacherTabs from './TeacherTabs';
import StudentTabs from './StudentTabs';
import useReducedMotion from '../hooks/useReducedMotion';
import { STACK_DURATION } from './motion';

const Stack = createNativeStackNavigator();

// Which stack to show depends on the login state and the profile
export default function AppNavigator() {
  const { user, profile, loading } = useAuth();

  // set while a student has just joined a class, so the "Entrou na turma" screen stays visible
  const [welcome, setWelcome] = useState(null);
  const checkingClass = useClassGuard(user?.uid, profile);
  const reduceMotion = useReducedMotion();

  if (loading || (user && !profile) || checkingClass) return <LoadingView message="Carregando..." />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'simple_push', animationDuration: STACK_DURATION, contentStyle: { backgroundColor: colors.background } }}>
      {!user ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'none' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: reduceMotion ? 'none' : 'fade_from_bottom' }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: reduceMotion ? 'none' : 'fade_from_bottom' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : profile.role === 'teacher' ? (
        <>
          <Stack.Screen name="TeacherTabs" component={TeacherTabs} />
          <Stack.Screen name="ClassForm" component={ClassFormScreen} options={{ animation: reduceMotion ? 'none' : 'fade_from_bottom' }} />
          <Stack.Screen name="ClassPanel" component={ClassPanelScreen} />
        </>
      ) : !profile.classId || welcome ? (
        <Stack.Screen name="JoinClass">
          {() => (
            <JoinClassScreen
              welcome={welcome}
              onJoining={setWelcome}
              onJoinFailed={() => setWelcome(null)}
              onContinue={() => setWelcome(null)}
            />
          )}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="StudentTabs" component={StudentTabs} />
          <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
          <Stack.Screen name="MyClass" component={MyClassScreen} />
          <Stack.Screen name="Lesson" component={LessonScreen} options={{ animation: reduceMotion ? 'none' : 'fade_from_bottom' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
