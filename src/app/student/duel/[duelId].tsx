import { useLocalSearchParams } from 'expo-router';
import DuelDetailScreen from '../../../screens/student/DuelDetailScreen';

export default function DuelDetailRoute() {
  const { duelId } = useLocalSearchParams();
  return <DuelDetailScreen duelId={String(duelId ?? '')} />;
}
