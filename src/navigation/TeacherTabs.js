import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import TabBar from './TabBar';
import ClassesScreen from '../screens/teacher/ClassesScreen';
import CreateQuizScreen from '../screens/teacher/CreateQuizScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';

const Tab = createBottomTabNavigator();
const ICONS = { Classes: 'users', CreateQuiz: 'file-plus', Profile: 'user' };

export default function TeacherTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => (
        <TabBar {...props} icons={ICONS} accent={colors.blue} accentSoft={colors.blueSoft} accentDark={colors.blue} />
      )}
    >
      <Tab.Screen name="Classes" component={ClassesScreen} options={{ title: 'Turmas' }} />
      <Tab.Screen name="CreateQuiz" component={CreateQuizScreen} options={{ title: 'Criar Quiz' }} />
      <Tab.Screen name="Profile" component={TeacherProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
