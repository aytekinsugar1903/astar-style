import {useEffect,useState} from 'react';
import {AccessibilityInfo,Pressable,StyleSheet,Text,View} from 'react-native';
import {useVideoPlayer,VideoView} from 'expo-video';
import {useI18n} from '@/i18n/I18nProvider';
import {useAppStyles} from './theme';
import {s as commonStyles} from './Studio';
export function ModelVideo(){
 const {t}=useI18n();const s=useAppStyles(commonStyles);
 const [reduceMotion,setReduceMotion]=useState(true);const [failed,setFailed]=useState(false);
 const player=useVideoPlayer(require('../../assets/model/weyra-model.mp4'),p=>{p.loop=true;p.muted=true;});
 useEffect(()=>{let active=true;void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(active)setReduceMotion(value);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduceMotion);return()=>{active=false;sub.remove();};},[]);
 useEffect(()=>{if(reduceMotion)player.pause();else player.play();},[player,reduceMotion]);
 useEffect(()=>{const sub=player.addListener('statusChange',event=>setFailed(event.status==='error'));return()=>sub.remove();},[player]);
 return <View><View style={styles.frame}><VideoView testID="weyra-model-video" player={player} style={styles.video} nativeControls playsInline contentFit="contain" fullscreenOptions={{enable:true}} allowsPictureInPicture accessibilityLabel={t('modelVideoLabel')}/></View><Pressable accessibilityRole="button" style={[s.light,{marginTop:12}]} onPress={()=>{setFailed(false);player.play();}}><Text style={s.lightText}>{t('modelVideoPlay')}</Text></Pressable>{failed&&<Text accessibilityLiveRegion="polite" style={s.notice}>{t('modelVideoFailed')}</Text>}<Text style={[s.copy,{fontSize:14,marginTop:16}]}>{t('modelVideoNotice')}</Text></View>;
}
const styles=StyleSheet.create({frame:{width:'100%',aspectRatio:910/512,backgroundColor:'#18212A',borderRadius:16,overflow:'hidden',marginTop:12},video:{width:'100%',height:'100%'}});
