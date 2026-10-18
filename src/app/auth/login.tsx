import LoginScreen from '../../screens/auth/LoginScreen';
import { useScreenNavigation } from '../../navigation/routeAdapter';
export default function LoginRoute() { return <LoginScreen navigation={useScreenNavigation()} />; }
