import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider } from '../contexts/AuthContext';
import { LoadingView } from '../components';
import { colors } from '../theme';
import useReducedMotion from '../hooks/useReducedMotion';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const reduceMotion = useReducedMotion();
  const [fontsLoaded] = useFonts({ PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold });
  if (!fontsLoaded) return <LoadingView message="Preparando o Práxis Edu..." />;
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><AuthProvider>
    <Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'slide_from_right', animationDuration: 240, contentStyle: { backgroundColor: colors.background } }} />
  </AuthProvider></SafeAreaProvider></GestureHandlerRootView>;
}
