import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';
import { useScreenNavigation } from '../../navigation/routeAdapter';
export default function ForgotPasswordRoute() { return <ForgotPasswordScreen navigation={useScreenNavigation()} />; }
