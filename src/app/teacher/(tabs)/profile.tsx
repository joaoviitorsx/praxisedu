import TeacherProfileScreen from '../../../screens/teacher/TeacherProfileScreen';
import { useScreenNavigation } from '../../../navigation/routeAdapter';
export default function TeacherProfileRoute() { return <TeacherProfileScreen navigation={useScreenNavigation()} />; }
