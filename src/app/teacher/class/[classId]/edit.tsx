import { useLocalSearchParams } from 'expo-router';
import ClassFormScreen from '../../../../screens/teacher/ClassFormScreen';
import { useScreenNavigation } from '../../../../navigation/routeAdapter';
export default function EditClassRoute() {
  const params = useLocalSearchParams();
  return <ClassFormScreen navigation={useScreenNavigation()} route={{ params }} />;
}
