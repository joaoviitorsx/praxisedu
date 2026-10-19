import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components';
import VideoEmbed from '../../components/VideoEmbed';
import { resolveVideoSource } from '../../features/trailMaterials';
import { openTrailMaterial } from '../../services/trailMaterialService';
import { colors, fonts, text } from '../../theme';

const LABELS = { text: 'LEITURA', video: 'VÍDEO', file: 'ARQUIVO' };

export default function LessonMaterials({ materials, onError }) {
  return <View style={styles.list}>
    {materials.map((item, index) => {
      const videoSource = item.kind === 'video' ? resolveVideoSource(item.url) : null;
      const videoKey = String(item.id ?? index);
      return <View key={videoKey} style={styles.card}>
        <View style={styles.heading}>
          <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={styles.divider} />
          <Text style={styles.kicker}>{LABELS[item.kind]}</Text>
        </View>

        {item.kind === 'text' && <>
          {!!item.title && <Text style={styles.title}>{item.title}</Text>}
          <Text style={styles.body}>{item.body}</Text>
        </>}

        {item.kind === 'video' && <>
          {!!item.title && <Text style={styles.title}>{item.title}</Text>}
          {videoSource ? <VideoEmbed source={videoSource} originalUrl={item.url} /> : <Text style={styles.hint}>Este vídeo não está disponível para reprodução.</Text>}
        </>}

        {item.kind === 'file' && <>
          <Text style={styles.title}>{item.name}</Text>
          <Pressable onPress={() => openTrailMaterial(item).catch(onError)} accessibilityRole="button" accessibilityLabel={`Abrir material ${item.name}`} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Icon name="file-text" size={18} color={colors.greenDark} />
            <Text style={styles.actionText}>Abrir arquivo</Text>
            <Icon name="arrow-right" size={18} color={colors.greenDark} />
          </Pressable>
        </>}
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { gap: 12, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  number: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.greenDark },
  divider: { width: 1, height: 14, backgroundColor: colors.border },
  kicker: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 0.7, color: colors.gray },
  title: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 25, color: colors.ink },
  body: { ...text.body, fontSize: 15, lineHeight: 24 },
  hint: { ...text.caption, lineHeight: 20 },
  action: { minHeight: 48, borderTopWidth: 1, borderColor: colors.border, marginTop: 2, paddingTop: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionText: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.greenDark },
  pressed: { opacity: 0.65 },
});
