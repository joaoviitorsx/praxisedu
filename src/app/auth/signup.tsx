import SignupScreen from '../../screens/auth/SignupScreen';
import { useScreenNavigation } from '../../navigation/routeAdapter';
export default function SignupRoute() { return <SignupScreen navigation={useScreenNavigation()} />; }
