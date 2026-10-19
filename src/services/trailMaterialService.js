import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';
import { isHttpsUrl } from '../features/trailMaterials';

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME = /^(image\/(png|jpeg|webp|gif)|text\/plain|application\/(pdf|msword|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|presentationml\.presentation)))$/;
const PICKER_TYPES = ['application/pdf', 'image/*', 'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

function mimeFor(asset) {
  if (asset.mimeType && asset.mimeType !== 'application/octet-stream') return asset.mimeType;
  const extension = asset.name?.split('.').pop()?.toLowerCase();
  return { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    txt: 'text/plain', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }[extension];
}

export async function pickAndUploadTrailMaterial({ teacherId, classId, unitId, lessonId, materialId }) {
  const result = await DocumentPicker.getDocumentAsync({ type: PICKER_TYPES, copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const size = asset.size ?? asset.file?.size ?? (Platform.OS === 'web' ? 0 : new File(asset.uri).size);
  if (!size || size > MAX_FILE_BYTES) throw new Error('Escolha um arquivo de até 15 MB.');
  const mimeType = mimeFor(asset);
  if (!mimeType || !ALLOWED_MIME.test(mimeType)) throw new Error('Use PDF, imagem, texto, Word ou PowerPoint.');
  const bytes = Platform.OS === 'web' && asset.file
    ? new Uint8Array(await asset.file.arrayBuffer())
    : await new File(asset.uri).bytes();
  // Every upload receives a new path so a draft never replaces a published file.
  const uploadId = `${materialId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const storagePath = `trailMaterials/${teacherId}/${classId}/${unitId}/${lessonId}/${uploadId}`;
  await uploadBytes(ref(storage, storagePath), bytes, { contentType: mimeType });
  return { name: asset.name, mimeType, size, storagePath, url: '' };
}

export async function openTrailMaterial(item) {
  const url = item.storagePath ? await getDownloadURL(ref(storage, item.storagePath)) : item.url;
  if (!isHttpsUrl(url)) throw new Error('Link do material inválido.');
  await WebBrowser.openBrowserAsync(url);
}
