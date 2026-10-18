import SplashScreen from '../../screens/auth/SplashScreen';
import { useScreenNavigation } from '../../navigation/routeAdapter';
export default function SplashRoute() { return <SplashScreen navigation={useScreenNavigation()} />; }
