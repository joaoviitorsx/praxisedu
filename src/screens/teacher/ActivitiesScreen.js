import { View, Text, StyleSheet } from 'react-native';
import { text } from '../../theme';

// Placeholder for the "Atividades" tab of the class panel (Ana Luiza).
// It receives classId so she can load quizzes/{classId}.
export default function ActivitiesScreen({ classId }) {
  return (
    <View style={styles.box}>
      <Text style={text.h2}>Atividades</Text>
      <Text style={text.caption}>Em construção · Ana Luiza</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingVertical: 48, gap: 6 },
});
