import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import TabBar from './TabBar';
import TrailsScreen from '../screens/student/TrailsScreen';
import DuelsScreen from '../screens/student/DuelsScreen';
import ClassroomScreen from '../screens/student/ClassroomScreen';
import BioBotScreen from '../screens/student/BioBotScreen';
import RankingScreen from '../screens/student/RankingScreen';

const Tab = createBottomTabNavigator();
const ICONS = { Trails: 'book-open', Duels: 'swords', Classroom: 'presentation', BioBot: 'message-circle', Ranking: 'trophy' };

export default function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => (
        <TabBar {...props} icons={ICONS} accent={colors.green} accentSoft={colors.greenSoft} accentDark={colors.greenDark} />
      )}
    >
      <Tab.Screen name="Trails" component={TrailsScreen} options={{ title: 'Trilhas' }} />
      <Tab.Screen name="Duels" component={DuelsScreen} options={{ title: 'Duelos' }} />
      <Tab.Screen name="Classroom" component={ClassroomScreen} options={{ title: 'Sala' }} />
      <Tab.Screen name="BioBot" component={BioBotScreen} options={{ title: 'BioBot' }} />
      <Tab.Screen name="Ranking" component={RankingScreen} options={{ title: 'Ranking' }} />
    </Tab.Navigator>
  );
}
