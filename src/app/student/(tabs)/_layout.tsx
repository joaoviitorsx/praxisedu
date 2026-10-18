import TopTabs from 'expo-router/js-top-tabs';
import TabBar from '../../../navigation/TabBar';
import { colors } from '../../../theme';

const icons = { trails: 'book-open', duels: 'swords', classroom: 'presentation', biobot: 'message-circle', ranking: 'trophy' };

export default function StudentTabsLayout() {
  return <TopTabs initialRouteName="trails" backBehavior="initialRoute" tabBarPosition="bottom" screenOptions={{ lazy: true, lazyPreloadDistance: 1, swipeEnabled: true, animationEnabled: true }} tabBar={(props) => (
    <TabBar {...props} icons={icons} accent={colors.green} accentSoft={colors.greenSoft} accentDark={colors.greenDark} featuredRoute="biobot" />
  )}>
    <TopTabs.Screen name="trails" options={{ title: 'Trilhas' }} />
    <TopTabs.Screen name="classroom" options={{ title: 'Sala' }} />
    <TopTabs.Screen name="biobot" options={{ title: 'BioBot' }} />
    <TopTabs.Screen name="duels" options={{ title: 'Duelos' }} />
    <TopTabs.Screen name="ranking" options={{ title: 'Ranking' }} />
  </TopTabs>;
}
