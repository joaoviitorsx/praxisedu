import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Input } from '../../components';
import { resolveVideoSource } from '../../features/trailMaterials';
import { colors, fonts, text } from '../../theme';

const types = [
  { kind: 'text', icon: 'file-text', label: 'Texto' },
  { kind: 'video', icon: 'play', label: 'Vídeo' },
  { kind: 'file', icon: 'file-plus', label: 'Arquivo' },
];

export default function StageMaterialsEditor({ materials, onAdd, onChange, onRemove, onUpload, uploading }) {
  return <View style={styles.root}>
    <View style={styles.heading}><View><Text style={styles.eyebrow}>MATERIAL DA ETAPA</Text><Text style={styles.title}>Conteúdo para estudar</Text></View><View style={styles.headingIcon}><Icon name="book-open" size={24} color={colors.blue} /></View></View>
    <Text style={styles.hint}>Apresente o assunto com textos, vídeos ou arquivos. Depois, se quiser, adicione questões para praticar.</Text>
    {materials.length === 0 && <View style={styles.empty}><Icon name="file-plus" size={28} color={colors.blue} /><Text style={styles.emptyTitle}>Adicione o primeiro material</Text><Text style={styles.hint}>A etapa pode ter só conteúdo, só questões ou os dois.</Text></View>}
    {materials.map((item, index) => <View key={item.id} style={styles.card}>
      <View style={styles.cardHeading}><View style={styles.typeIcon}><Icon name={types.find((type) => type.kind === item.kind)?.icon ?? 'file-text'} size={20} color={colors.blue} /></View><Text style={styles.cardTitle}>{types.find((type) => type.kind === item.kind)?.label} {index + 1}</Text><Pressable onPress={() => onRemove(item.id)} accessibilityRole="button" accessibilityLabel={`Remover material ${index + 1}`} style={styles.remove}><Icon name="trash" size={19} color={colors.redText} /></Pressable></View>
      {item.kind === 'text' && <>
        <Input label="Título do texto (opcional)" value={item.title ?? ''} onChangeText={(title) => onChange(item.id, { title })} placeholder="Ex.: As organelas da célula" accent={colors.blue} maxLength={80} />
        <Input label="Conteúdo" value={item.body ?? ''} onChangeText={(body) => onChange(item.id, { body })} placeholder="Ex.: As organelas desempenham funções essenciais na célula..." multiline style={styles.bodyInput} accent={colors.blue} />
      </>}
      {item.kind === 'video' && <>
        <Input label="Título do vídeo (opcional)" value={item.title ?? ''} onChangeText={(title) => onChange(item.id, { title })} placeholder="Ex.: Revisão de citologia" accent={colors.blue} maxLength={80} />
        <Input label="Link do vídeo" value={item.url ?? ''} onChangeText={(url) => onChange(item.id, { url })} placeholder="Ex.: https://www.youtube.com/watch?v=..." autoCapitalize="none" keyboardType="url" accent={colors.blue} hint="YouTube, Vimeo ou link direto para MP4/HLS." />
        {!!item.url?.trim() && <View style={[styles.videoStatus, !resolveVideoSource(item.url) && styles.videoError]}><Icon name={resolveVideoSource(item.url) ? 'check-circle' : 'alert-triangle'} size={18} color={resolveVideoSource(item.url) ? colors.green : colors.redText} /><Text style={[styles.videoStatusText, !resolveVideoSource(item.url) && styles.videoErrorText]}>{resolveVideoSource(item.url) ? 'Formato compatível com reprodução no app' : 'Confira o link do vídeo'}</Text></View>}
      </>}
      {item.kind === 'file' && <>
        <Input label="Nome do material" value={item.name ?? ''} onChangeText={(name) => onChange(item.id, { name })} placeholder="Ex.: Resumo de citologia.pdf" accent={colors.blue} maxLength={100} />
        {item.storagePath ? <View style={styles.uploaded}><Icon name="check-circle" size={20} color={colors.green} /><Text style={styles.uploadedText}>Arquivo enviado · {item.mimeType || 'documento'}</Text></View>
          : <Input label="Ou link HTTPS do arquivo" value={item.url ?? ''} onChangeText={(url) => onChange(item.id, { url })} placeholder="Ex.: https://site.edu.br/resumo.pdf" autoCapitalize="none" keyboardType="url" accent={colors.blue} />}
        <Button title={item.storagePath ? 'Trocar arquivo' : 'Selecionar arquivo'} icon="file-plus" variant="outline" size="md" loading={uploading === item.id} onPress={() => onUpload(item.id)} />
        <Text style={styles.hint}>PDF, imagem, texto, Word ou PowerPoint · até 15 MB.</Text>
      </>}
    </View>)}
    <View style={styles.addRow}>{types.map((type) => <Pressable key={type.kind} onPress={() => onAdd(type.kind)} accessibilityRole="button" accessibilityLabel={`Adicionar ${type.label.toLowerCase()}`} style={({ pressed }) => [styles.addChoice, pressed && styles.pressed]}><Icon name={type.icon} size={18} color={colors.blue} /><Text style={styles.addText}>{type.label}</Text></Pressable>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  root: { gap: 14 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 0.8, color: colors.blue },
  title: { ...text.h2, fontSize: 19 }, hint: { ...text.caption, lineHeight: 19 },
  headingIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 8, padding: 18, borderRadius: 20, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  card: { gap: 12, padding: 16, borderRadius: 20, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  cardTitle: { flex: 1, fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bodyInput: { height: undefined, minHeight: 140, paddingVertical: 14, textAlignVertical: 'top' },
  videoStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: colors.greenSoft },
  videoError: { backgroundColor: colors.redSoft }, videoStatusText: { ...text.caption, color: colors.greenDark, flex: 1 }, videoErrorText: { color: colors.redText },
  uploaded: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: colors.greenSoft },
  uploadedText: { ...text.caption, color: colors.greenDark, flex: 1 },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addChoice: { minHeight: 48, flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 13, borderWidth: 2, borderColor: '#C7D5F8', backgroundColor: colors.surface },
  addText: { fontFamily: fonts.bold, fontSize: 13, color: colors.blue }, pressed: { opacity: 0.65 },
});
