import MyClassScreen from '../../screens/student/MyClassScreen';
import { useScreenNavigation } from '../../navigation/routeAdapter';
export default function MyClassRoute() { return <MyClassScreen navigation={useScreenNavigation()} />; }
