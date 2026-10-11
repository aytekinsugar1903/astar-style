import {useState} from 'react';
import {Platform,Pressable,SafeAreaView,ScrollView,Text,TextInput,View} from 'react-native';
import {useRouter} from 'expo-router';
import {useI18n} from '@/i18n/I18nProvider';
import {useAppStyles} from '@/studio/theme';
import {s as styles} from '@/studio/StudioStyles';
import {FeedFile} from '@/catalog/FeedFile';
import {createBackup,parseBackup,restoreBackup,type Backup} from '@/daily/backup';
import {saveData} from '@/daily/SaveData';
export default function BackupScreen(){const s=useAppStyles(styles),{t}=useI18n(),router=useRouter(),[personal,setPersonal]=useState(false),[busy,setBusy]=useState(false),[raw,setRaw]=useState(''),[staged,setStaged]=useState<Backup|null>(null),[phrase,setPhrase]=useState(''),[message,setMessage]=useState('');async function act(fn:()=>Promise<void>){setBusy(true);setMessage('');try{await fn();}catch{setMessage(t('backupInvalid'));}finally{setBusy(false);}}
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}><Pressable onPress={()=>router.push('/profile')}><Text style={s.link}>{t('back')}</Text></Pressable><Text style={s.title}>{t('backupTitle')}</Text><Text style={s.copy}>{t('backupCopy')}</Text><Text style={s.footer}>{t('backupPrivate')}</Text><Pressable accessibilityRole="checkbox" aria-checked={personal} accessibilityState={{checked:personal}} onPress={()=>setPersonal(v=>!v)} style={s.chip}><Text style={s.chipText}>{personal?'☑':'☐'} {t('backupPersonal')}</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} style={s.dark} onPress={()=>void act(async()=>{await saveData(await createBackup(personal),'weyra-backup.json');setMessage(t('backupExported'));})}><Text style={s.darkText}>{t('backupExport')}</Text></Pressable>
 <Text style={[s.sectionTitle,{marginTop:28}]}>{t('backupImport')}</Text><FeedFile onText={text=>{setRaw(text);setStaged(null);setPhrase('');}} disabled={busy}/>{Platform.OS!=='web'&&<TextInput accessibilityLabel={t('backupPaste')} placeholder={t('backupPaste')} multiline value={raw} onChangeText={v=>{setRaw(v);setStaged(null);}} style={[s.input,{height:130}]}/>}
 <Pressable accessibilityRole="button" disabled={busy||!raw} style={s.light} onPress={()=>void act(async()=>{const result=parseBackup(raw);setStaged(result);setMessage(t('backupPreview',{count:Object.keys(result.entries).length}));})}><Text style={s.lightText}>{t('backupCheck')}</Text></Pressable>
 {staged&&<View style={s.panel}><Text style={s.copy}>{t('backupReplace')}</Text><TextInput accessibilityLabel={t('backupConfirm')} placeholder={t('backupConfirm')} value={phrase} onChangeText={setPhrase} style={s.input}/><Pressable accessibilityRole="button" disabled={busy||phrase!==t('backupPhrase')} style={[s.dark,(busy||phrase!==t('backupPhrase'))&&{opacity:.4}]} onPress={()=>void act(async()=>{await restoreBackup(staged);setStaged(null);setRaw('');setMessage(t('backupRestored'));})}><Text style={s.darkText}>{t('backupRestore')}</Text></Pressable></View>}
 {!!message&&<Text accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>}</ScrollView></SafeAreaView>;
}
