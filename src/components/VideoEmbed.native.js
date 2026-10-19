import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { colors, fonts } from '../theme';

const referrer = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}/` : 'https://expo.dev/';

function DirectVideo({ uri }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={styles.player} nativeControls fullscreenOptions={{ enable: true }} contentFit="contain" />;
}

export default function VideoEmbed({ source, originalUrl }) {
  const [failed, setFailed] = useState(false);
  return <View style={styles.wrap}>
    {source.kind === 'direct' ? <DirectVideo uri={source.uri} /> : !failed
      ? <WebView source={{ uri: source.uri, headers: { Referer: referrer } }} style={styles.player}
        javaScriptEnabled domStorageEnabled allowsFullscreenVideo allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction onError={() => setFailed(true)} />
      : <View style={styles.fallback}><Text style={styles.fallbackText}>Não foi possível carregar o vídeo incorporado.</Text></View>}
    <Pressable onPress={() => WebBrowser.openBrowserAsync(originalUrl)} accessibilityRole="button" style={styles.open}><Text style={styles.openText}>Abrir vídeo em outra janela</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  player: { width: '100%', height: 210, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.ink },
  fallback: { height: 210, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: colors.ink },
  fallbackText: { fontFamily: fonts.bold, color: colors.white, textAlign: 'center' },
  open: { minHeight: 44, justifyContent: 'center', alignItems: 'center' }, openText: { fontFamily: fonts.bold, fontSize: 13, color: colors.blue },
});
