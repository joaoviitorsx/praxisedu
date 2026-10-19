import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { LoadingView } from './src/components';
import { preloadMascotImages } from './src/services/mascotImageCache';
import { colors } from './src/theme';

const navTheme = {
  dark: false,
  colors: { primary: colors.purple, background: colors.background, card: colors.surface, text: colors.ink, border: colors.border, notification: colors.red },
  fonts: {
    regular: { fontFamily: 'PlusJakartaSans_500Medium', fontWeight: '400' },
    medium: { fontFamily: 'PlusJakartaSans_600SemiBold', fontWeight: '500' },
    bold: { fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '600' },
    heavy: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontWeight: '700' },
  },
};

export default function App() {
  useEffect(() => { preloadMascotImages().catch(() => {}); }, []);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) return <LoadingView />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
