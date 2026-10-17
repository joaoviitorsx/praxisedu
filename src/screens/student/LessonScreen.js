import { Placeholder } from '../../components';
import { colors } from '../../theme';

// Placeholder for "Lição Interativa" (Maurício). Receives { lessonId, title } in route.params.
export default function LessonScreen({ navigation, route }) {
  return (
    <Placeholder title={route.params?.title ?? 'Lição'} owner="Maurício" accent={colors.green} onBack={() => navigation.goBack()} />
  );
}
