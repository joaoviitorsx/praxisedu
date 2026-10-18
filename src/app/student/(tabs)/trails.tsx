import TrailsScreen from '../../../screens/student/TrailsScreen';
import { useScreenNavigation } from '../../../navigation/routeAdapter';
export default function TrailsRoute() { return <TrailsScreen navigation={useScreenNavigation()} />; }
