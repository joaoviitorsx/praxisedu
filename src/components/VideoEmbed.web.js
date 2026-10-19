import { StyleSheet, View } from 'react-native';

export default function VideoEmbed({ source }) {
  return <View style={styles.wrap}>
    {source.kind === 'direct'
      ? <video src={source.uri} controls playsInline style={styles.player} />
      : <iframe src={source.uri} title="Vídeo da etapa" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={styles.player} />}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', minHeight: 210 },
  player: { width: '100%', height: 210, border: 0, borderRadius: 14, backgroundColor: '#1A1A2E' },
});
