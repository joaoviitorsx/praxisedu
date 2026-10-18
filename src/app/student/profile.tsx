import StudentProfileScreen from '../../screens/student/StudentProfileScreen';
import { useScreenNavigation } from '../../navigation/routeAdapter';
export default function StudentProfileRoute() { return <StudentProfileScreen navigation={useScreenNavigation()} />; }
