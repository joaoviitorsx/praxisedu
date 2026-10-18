import { useLocalSearchParams } from 'expo-router';
import LessonScreen from '../../../screens/student/LessonScreen';
import { useScreenNavigation } from '../../../navigation/routeAdapter';
export default function LessonRoute() {
  const params = useLocalSearchParams();
  return <LessonScreen navigation={useScreenNavigation()} route={{ params }} />;
}
