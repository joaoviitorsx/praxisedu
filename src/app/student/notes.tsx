import NotesScreen from '../../screens/student/NotesScreen';
import { useScreenNavigation } from '../../navigation/routeAdapter';

export default function NotesRoute() {
  return <NotesScreen navigation={useScreenNavigation()} />;
}
