import { useLocalSearchParams } from 'expo-router';
import ClassesScreen from '../../../screens/teacher/ClassesScreen';
import { useScreenNavigation } from '../../../navigation/routeAdapter';

export default function ClassesRoute() {
  const params = useLocalSearchParams();
  return <ClassesScreen navigation={useScreenNavigation()} route={{ params }} />;
}
