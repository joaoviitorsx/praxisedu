import TopTabs from 'expo-router/js-top-tabs';
import TabBar from '../../../navigation/TabBar';
import { colors } from '../../../theme';

const icons = { classes: 'users', 'create-quiz': 'book-open', attendance: 'check-circle', profile: 'user' };

export default function TeacherTabsLayout() {
  return <TopTabs initialRouteName="classes" backBehavior="initialRoute" tabBarPosition="bottom" screenOptions={{ lazy: true, lazyPreloadDistance: 1, swipeEnabled: true, animationEnabled: true }} tabBar={(props) => (
    <TabBar {...props} icons={icons} accent={colors.blue} accentSoft={colors.blueSoft} accentDark={colors.blue} />
  )}>
    <TopTabs.Screen name="classes" options={{ title: 'Turmas' }} />
    <TopTabs.Screen name="create-quiz" options={{ title: 'Atividade' }} />
    <TopTabs.Screen name="attendance" options={{ title: 'Chamadas' }} />
    <TopTabs.Screen name="profile" options={{ title: 'Perfil' }} />
  </TopTabs>;
}
