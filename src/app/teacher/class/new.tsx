import ClassFormScreen from '../../../screens/teacher/ClassFormScreen';
import { useScreenNavigation } from '../../../navigation/routeAdapter';
export default function NewClassRoute() { return <ClassFormScreen navigation={useScreenNavigation()} route={{ params: {} }} />; }
