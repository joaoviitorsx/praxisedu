import { Image as NativeImage } from 'react-native';
import { Image } from 'expo-image';
import { classMascotsImage, mascotImages } from '../constants/mascotImages';

let preloadPromise;

export function preloadMascotImages() {
  if (!preloadPromise) {
    const urls = [classMascotsImage, ...Object.values(mascotImages)]
      .map((source) => NativeImage.resolveAssetSource(source)?.uri)
      .filter((uri) => /^https?:\/\//.test(uri ?? ''));
    preloadPromise = urls.length ? Image.prefetch(urls, 'memory-disk') : Promise.resolve(true);
  }
  return preloadPromise;
}
