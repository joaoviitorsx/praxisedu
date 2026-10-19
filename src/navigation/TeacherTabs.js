import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import TabBar from './TabBar';
import ClassesScreen from '../screens/teacher/ClassesScreen';
import ActivityHubScreen from '../screens/teacher/ActivityHubScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';
import useReducedMotion from '../hooks/useReducedMotion';
import { TAB_TRANSITION } from './motion';

const Tab = createBottomTabNavigator();
const ICONS = { Classes: 'users', CreateQuiz: 'book-open', Profile: 'user' };

export default function TeacherTabs() {
  const reduceMotion = useReducedMotion();
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'fade', transitionSpec: TAB_TRANSITION }}
      tabBar={(props) => (
        <TabBar {...props} icons={ICONS} accent={colors.blue} accentSoft={colors.blueSoft} accentDark={colors.blue} />
      )}
    >
      <Tab.Screen name="Classes" component={ClassesScreen} options={{ title: 'Turmas' }} />
      <Tab.Screen name="CreateQuiz" component={ActivityHubScreen} options={{ title: 'Atividade' }} />
      <Tab.Screen name="Profile" component={TeacherProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
