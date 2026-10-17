import { Placeholder } from '../../components';
import { colors } from '../../theme';

export default function StudentProfileScreen({ navigation }) {
  // TEMP: Maria Alice's profile screen will link to "MyClass" (screen 33)
  return (
    <Placeholder title="Perfil do aluno" owner="Maria Alice" accent={colors.green}
      actions={[{ title: 'Minha Turma', onPress: () => navigation.navigate('MyClass') }]} />
  );
}
