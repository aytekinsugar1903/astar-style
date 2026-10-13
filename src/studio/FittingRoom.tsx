import {useAppStyles} from '@/studio/theme';
import {useViewport} from '@/studio/viewport';
import {ModelVideo} from '@/studio/ModelVideo';
import {ModelMannequin} from '@/studio/ModelMannequin';
import {modelSlot,type ModelSlot,type ModelKind} from '@/studio/mannequin';
import {useEffect,useState,useMemo,useRef} from 'react';
import {Image,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import Svg,{Defs,Ellipse,G,LinearGradient,Path,Stop,Line} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {useI18n} from '@/i18n/I18nProvider';
import type {TranslationKey} from '@/i18n/translations';
import {picture,useCloset,type Garment} from '@/studio/closet';
import {selectPhoto} from '@/studio/media';
import {defaultRegions,regionIds,restoreRegions,regionValue,type BodyRegions} from '@/studio/avatarShape';
import {colors} from '@/studio/taxonomy';
import {s as commonStyles,palette} from './StudioStyles';
import {CatalogInRoom} from '@/catalog/CatalogInRoom';
type Measurements={height:number;chest:number;waist:number;hip:number;inseam:number;thigh:number};
type Slot='top'|'bottom'|'shoes';
const defaults:Measurements={height:172,chest:94,waist:78,hip:98,inseam:80,thigh:54};
const fields:[keyof Measurements,TranslationKey,number,number][]=[['height','avatarHeight',140,210],['chest','avatarChest',60,160],['waist','avatarWaist',45,160],['hip','avatarHip',60,180],['inseam','avatarInseam',50,110],['thigh','avatarThigh',30,100]];
const key='weyra:avatar:v1';
const bound=(n:number,min:number,max:number)=>Math.max(min,Math.min(n,max));
const valid=(m:Measurements)=>fields.every(([id,,min,max])=>Number.isFinite(m[id])&&m[id]>=min&&m[id]<=max)&&m.inseam<m.height*.65;
const slotOf=(p:Garment):Slot=>p.category==='shoes'?'shoes':['trousers','skirt','dress'].includes(p.category)?'bottom':'top';
const garmentColor=(p?:Garment)=>colors.find(c=>c.id===p?.colors[0])?.hex??'#D8D3CA';
export function AvatarDrawing({measurements,regions,top,bottom,shoes,height=340}:{height?:number;measurements:Measurements;regions:BodyRegions;top?:Garment;bottom?:Garment;shoes?:Garment}){
 const m=measurements;const shoulders=bound(m.chest*.43*regions.shoulders/100,28,64),chest=bound(m.chest*.38*regions.chest/100,25,65),waist=bound(m.waist*.33*regions.waist/100,18,62),hip=bound(m.hip*.34*regions.hip/100,24,69),thigh=bound(m.thigh*.28*regions.thigh/100,9,29),calf=bound((m.thigh*.14+3)*regions.calf/100,6,24);
 const crotch=bound(400-m.inseam/m.height*300,228,278),knee=318,center=hip*.58+7;const skin='#CFB8A4';const dress=bottom?.category==='dress',skirt=bottom?.category==='skirt';const upper=dress?garmentColor(bottom):top?garmentColor(top):'url(#skin)',lower=bottom?garmentColor(bottom):'url(#skin)';
 const shoulderPath=`M140 86 Q ${150-shoulders*.65} 93 ${150-shoulders} 105 L ${150-chest} 129 Q150 140 ${150+chest} 129 L ${150+shoulders} 105 Q ${150+shoulders*.65} 93 160 86 Z`;
 const chestPath=`M${150-chest} 128 C${147-chest} 145 ${150-waist} 149 ${150-waist} 165 Q150 171 ${150+waist} 165 C${150+waist} 149 ${153+chest} 145 ${150+chest} 128 Q150 140 ${150-chest} 128 Z`;
 const waistPath=`M${150-waist} 163 Q150 170 ${150+waist} 163 Q${153+waist} 187 ${150+hip} 201 Q150 213 ${150-hip} 201 Q${147-waist} 187 ${150-waist} 163 Z`;
 const hipPath=`M${150-hip} 199 Q150 211 ${150+hip} 199 Q${156+hip} 224 ${150+center+thigh} 242 L${150+center-thigh} ${crotch} Q150 ${crotch-6} ${150-center+thigh} ${crotch} L${150-center-thigh} 242 Q${144-hip} 224 ${150-hip} 199 Z`;
 const thighPath=`M${150-center-thigh} 239 C${150-center-thigh-2} 265 ${150-center-10} 290 ${150-center-9} ${knee} L${150-center+9} ${knee} C${150-center+10} 290 ${150-center+thigh} 271 ${150-center+thigh} ${crotch} Z`;
 const calfPath=`M${150-center-9} ${knee-1} C${150-center-calf} 333 ${150-center-calf-1} 348 ${150-center-7} 382 Q${150-center} 388 ${150-center+7} 382 C${150-center+calf+1} 348 ${150-center+calf} 333 ${150-center+9} ${knee-1} Z`;
 const armPath=`M${150-shoulders+1} 103 C${136-shoulders} 107 ${132-shoulders} 133 ${129-shoulders} 158 Q${125-shoulders} 171 ${123-shoulders} 192 L${119-shoulders} 229 Q${118-shoulders} 239 ${123-shoulders} 241 Q${130-shoulders} 242 ${133-shoulders} 233 L${137-shoulders} 197 Q${140-shoulders} 179 ${141-shoulders} 168 C${143-shoulders} 145 ${149-shoulders} 130 ${153-shoulders} 120 Z`;
 const handPath=`M${119-shoulders} 231 Q${115-shoulders} 242 ${116-shoulders} 251 L${119-shoulders} 267 Q${121-shoulders} 272 ${123-shoulders} 267 L${123-shoulders} 255 L${124-shoulders} 271 Q${127-shoulders} 275 ${128-shoulders} 270 L${128-shoulders} 253 L${130-shoulders} 267 Q${133-shoulders} 270 ${134-shoulders} 265 L${133-shoulders} 249 L${138-shoulders} 252 Q${143-shoulders} 251 ${141-shoulders} 246 L${134-shoulders} 235 Q${128-shoulders} 228 ${119-shoulders} 231 Z`;
 const mirror='translate(300 0) scale(-1 1)';const legScale=((239-86)*1.15)/(382-239);const legTransform=`translate(0 239) scale(1 ${legScale}) translate(0 -239)`;
 return <Svg width="100%" height={height} viewBox="0 0 300 470" accessibilityLabel="WEYRA avatar" accessibilityRole="image"><Defs><LinearGradient id="skin" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#B89B84"/><Stop offset=".5" stopColor="#E5D4C4"/><Stop offset="1" stopColor="#C4AA93"/></LinearGradient></Defs><Ellipse cx="150" cy="448" rx="62" ry="9" fill="#E3E8E2"/>
 <G testID="avatar-arms" fill="url(#skin)" stroke="#B69C86" strokeWidth={.75}>{[undefined,mirror].map((transform,i)=><G key={i} transform={transform}><Path d={armPath}/><Path d={handPath}/><Path d={`M${125-shoulders} 168 Q${132-shoulders} 173 ${138-shoulders} 169 M${119-shoulders} 232 L${133-shoulders} 235`} fill="none" stroke="#A98D77" strokeWidth={.6}/></G>)}</G>
 <G testID="avatar-lower-body" transform={legTransform}><G testID="avatar-region-thigh" fill={lower}><Path d={thighPath}/><Path d={thighPath} transform={mirror}/></G><G testID="avatar-region-calf" fill={lower}><Path d={calfPath}/><Path d={calfPath} transform={mirror}/></G>
 </G><Path testID="avatar-region-hip" d={hipPath} fill={lower}/><Path testID="avatar-region-waist" d={waistPath} fill={upper}/><Path testID="avatar-region-chest" d={chestPath} fill={upper}/><Path d="M140 74 L140 92 Q150 103 160 92 L160 74" fill="url(#skin)"/><Path testID="avatar-region-shoulders" d={shoulderPath} fill={upper}/>
 <Ellipse cx="150" cy="50" rx="20" ry="29" fill="url(#skin)" stroke="#BDA18B" strokeWidth={.6}/><Path d="M130 44 Q128 17 150 18 Q173 17 170 44 Q161 26 141 33 Z" fill="#4A4038"/><Path d="M142 59 Q150 63 158 59" fill="none" stroke="#B5957D" strokeWidth={.8}/>
 {top&&!dress&&<G fill={upper}>{[undefined,mirror].map((transform,i)=><Path key={i} transform={transform} d={top.category==='tshirt'?`M${150-shoulders} 103 Q${137-shoulders} 109 ${132-shoulders} 142 L${146-shoulders} 149 L${157-shoulders} 116 Z`:armPath}/>)}</G>}
 {(top||dress)&&<><Path d={top?.subtype==='vneck'?'M140 90 L150 111 L160 90':'M140 90 Q150 106 160 90'} fill={skin}/>{top?.subtype==='polo'&&<Path d="M140 91 L133 107 L148 102 L150 119 L152 102 L167 107 L160 91" fill="#E8E5DD" stroke="#ADABA3"/>}</>}
 {(dress||skirt)&&<Path d={`M${150-waist} ${dress?175:204} L${150+waist} ${dress?175:204} Q${159+hip} 253 ${175+hip} ${bottom?.subtype==='maxi'?375:300} Q150 ${bottom?.subtype==='maxi'?390:311} ${125-hip} ${bottom?.subtype==='maxi'?375:300} Q${141-hip} 253 ${150-waist} ${dress?175:204} Z`} fill={lower}/>}
 {bottom?.category==='trousers'&&<Line x1="150" y1="213" x2="150" y2={crotch-6} stroke="#73736D" strokeWidth={1}/>}
 <G transform={legTransform} fill={shoes?garmentColor(shoes):skin} stroke="#666D67" strokeWidth={.6}>{[undefined,mirror].map((transform,i)=><Path key={i} transform={transform} d={`M${150-center-7} 381 L${150-center+7} 381 L${150-center+8} 398 Q${150-center} 405 ${150-center-16} 399 Q${150-center-19} 392 ${150-center-7} 381 Z`}/>)}</G></Svg>;
}
import {useImportedCatalog,variantGarment} from '@/catalog/imported';
export default function FittingRoom({initialCategory,initialPiece,onClose}:{initialCategory?:string;initialPiece?:string;onClose?:()=>void}={}){
 const roomScroll=useRef<ScrollView>(null);const catalogScroll=useRef<ScrollView>(null);const {width,height:screenHeight}=useViewport();const stageHeight=width>=800?500:Math.max(230,Math.min(340,screenHeight*.36));
 const s=useAppStyles(commonStyles);const a=useAppStyles(avatarStyles);const {t}=useI18n();const router=useRouter();
 const params=useLocalSearchParams<{piece?:string}>();const {items:closetItems,ready:closetReady}=useCloset();const imported=useImportedCatalog();const ready=closetReady&&imported.ready;const items=useMemo(()=>[...imported.products.flatMap(p=>p.variants.map(v=>variantGarment(p,v))),...closetItems],[closetItems,imported.products]);
 const [m,setM]=useState<Measurements>(defaults);const [regions,setRegions]=useState<BodyRegions>(defaultRegions);
 const [selected,setSelected]=useState<Partial<Record<ModelSlot,string>>>({});const [slot,setSlot]=useState<ModelSlot>(initialCategory==='shoes'?'shoes':['trousers','skirt','dress'].includes(initialCategory??'')?'bottom':initialCategory==='bag'?'bag':initialCategory==='accessory'?'accessory':'top');
 const [kind,setKind]=useState<ModelKind>('female');const [tab,setTab]=useState<'model'|'video'|'measurements'>('model');
 const [message,setMessage]=useState('');const [personalPhoto,setPersonalPhoto]=useState<string|null>(null);const [loaded,setLoaded]=useState(false);
 useEffect(()=>{let active=true;void Promise.all([AsyncStorage.getItem(key),AsyncStorage.getItem('weyra:personal-photo:v1')]).then(([raw,photo])=>{if(!active)return;setPersonalPhoto(photo);if(raw){const p=JSON.parse(raw);if(p.measurements&&valid(p.measurements)){setM(p.measurements);setRegions(restoreRegions(p));const picks:Partial<Record<ModelSlot,string>>={};for(const id of ['top','bottom','shoes','bag','accessory'] as ModelSlot[])if(typeof p.selected?.[id]==='string')picks[id]=p.selected[id];setSelected(picks);setKind(p.kind==='male'?'male':'female');}}}).catch(()=>active&&setMessage(t('avatarStorageError'))).finally(()=>active&&setLoaded(true));return()=>{active=false;};},[]);
 useEffect(()=>{if(!ready||!loaded||!(initialPiece??params.piece))return;const p=items.find(x=>x.id===(initialPiece??params.piece));if(p){if(p.wearable)setKind(p.wearable.kind);const sl=modelSlot(p);setSlot(sl);setSelected(prev=>({...prev,[sl]:p.id,...(p.category==='dress'?{top:undefined}:sl==='top'&&items.find(x=>x.id===prev.bottom)?.category==='dress'?{bottom:undefined}:{})}));}},[ready,loaded,params.piece,initialPiece,items]);
 const look={top:items.find(p=>p.id===selected.top),bottom:items.find(p=>p.id===selected.bottom),shoes:items.find(p=>p.id===selected.shoes),bag:items.find(p=>p.id===selected.bag),accessory:items.find(p=>p.id===selected.accessory)};

 const safe=Object.fromEntries(fields.map(([id,,min,max])=>[id,bound(Number.isFinite(m[id])?m[id]:defaults[id],min,max)])) as Measurements;
 const preview=<AvatarDrawing height={stageHeight} measurements={safe} regions={regions} top={look.top} bottom={look.bottom} shoes={look.shoes}/>;
 async function save(){if(!valid(m)){setMessage(t('avatarInvalid'));return;}try{await AsyncStorage.setItem(key,JSON.stringify({measurements:m,regions,selected,kind}));setMessage(t('avatarSaved'));}catch{setMessage(t('avatarStorageError'));}}
 async function pickPersonal(){try{const photo=await selectPhoto();if(photo){await AsyncStorage.setItem('weyra:personal-photo:v1',photo.data);setPersonalPhoto(photo.data);}}catch{setMessage(t('photoFailed'));}}
 async function deletePersonal(){try{await AsyncStorage.removeItem('weyra:personal-photo:v1');setPersonalPhoto(null);}catch{setMessage(t('avatarStorageError'));}}
 async function remove(){try{await AsyncStorage.removeItem(key);await AsyncStorage.removeItem('weyra:personal-photo:v1');setPersonalPhoto(null);setM(defaults);setRegions(defaultRegions);setSelected({});setKind('female');setMessage(t('avatarDeleted'));}catch{setMessage(t('avatarStorageError'));}}
 function choose(p:Garment){requestAnimationFrame(()=>{if(width<800)roomScroll.current?.scrollTo({y:0,animated:true});else catalogScroll.current?.scrollTo({y:0,animated:false});});if(p.wearable)setKind(p.wearable.kind);const sl=modelSlot(p);setSelected(prev=>({...prev,[sl]:p.id,...(p.category==='dress'?{top:undefined}:sl==='top'&&look.bottom?.category==='dress'?{bottom:undefined}:{})}));}
 const slotLabel=(id:ModelSlot)=>t(id==='top'?'avatarTop':id==='bottom'?'avatarBottom':id==='shoes'?'avatarShoes':id==='bag'?'modelBag':'modelAccessory');
 const catalogBody = <>
 {tab==='model'&&<><View style={s.filters}>{(['top','bottom','shoes','bag','accessory'] as ModelSlot[]).map(id=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:slot===id}} onPress={()=>setSlot(id)} style={[s.chip,slot===id&&s.chipOn]}><Text style={[s.chipText,slot===id&&s.chipTextOn]}>{slotLabel(id)}</Text></Pressable>)}</View>
 <CatalogInRoom products={imported.products} garments={closetItems} initialCategory={initialCategory} slot={slot} onChoose={choose} selectedId={selected[slot]} onRemove={()=>setSelected(prev=>({...prev,[slot]:undefined}))}/></>}
 {tab==='measurements'&&<>
 <Text style={s.copy}>{t('avatarRegionsCopy')}</Text><View style={s.grid}>{regionIds.map(id=>{const label=('avatarRegion'+id[0].toUpperCase()+id.slice(1)) as TranslationKey;const value=regions[id];return <View key={id} style={s.menu}><Text style={s.menuTitle}>{t(label)} · {value}%</Text><View style={s.row}>{([-5,5] as const).map(delta=><Pressable key={delta} accessibilityRole="button" accessibilityLabel={t(label)+' '+t(delta<0?'avatarThinner':'avatarWider')} disabled={!loaded||(delta<0?value<=70:value>=140)} onPress={()=>setRegions(prev=>({...prev,[id]:regionValue(prev[id]+delta)}))} style={s.light}><Text style={s.lightText}>{delta<0?'−':'+'}</Text></Pressable>)}</View></View>;})}</View><Pressable onPress={()=>setRegions(defaultRegions)}><Text style={[s.link,{marginTop:15}]}>{t('avatarReset')}</Text></Pressable>
 <View style={s.section}><Text style={s.sectionTitle}>{t('avatarMeasurements')}</Text></View><View style={s.grid}>{fields.map(([id,label,min,max])=><View key={id} style={{flexBasis:140,flexGrow:1}}><Text style={s.small}>{t(label)} · {min}–{max} cm</Text><TextInput style={s.input} accessibilityLabel={t(label)} value={String(m[id]||'')} keyboardType="decimal-pad" onChangeText={v=>setM(prev=>({...prev,[id]:Number(v.replace(',','.'))}))}/></View>)}</View>
 {personalPhoto&&<><Image accessibilityLabel={t("personalPhoto")} source={{uri:personalPhoto}} style={{height:300,width:'100%'}} resizeMode="contain"/><Pressable onPress={()=>void deletePersonal()}><Text style={s.link}>{t('deletePersonalPhoto')}</Text></Pressable></>}<Pressable style={[s.light,{marginTop:15}]} onPress={()=>void pickPersonal()}><Text style={s.lightText}>{t(personalPhoto?'changePersonalPhoto':'addPersonalPhoto')}</Text></Pressable><Text style={s.footer}>{t('photoPrivacy')}</Text><Pressable accessibilityRole="button" onPress={()=>void remove()}><Text style={s.link}>{t('avatarDelete')}</Text></Pressable>
 </>}
 <View style={s.filters}>{Object.values(look).filter((p):p is Garment=>!!p).map(p=><Text key={p.id} style={s.chipText}>{p.name}</Text>)}</View><View style={s.row}><Pressable style={s.light} onPress={()=>setSelected({})}><Text style={s.lightText}>{t('modelClear')}</Text></Pressable><Pressable style={s.dark} disabled={!loaded} onPress={()=>void save()}><Text style={s.darkText}>{t('avatarSave')}</Text></Pressable></View>
 {!!message&&<Text accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>}<Text style={s.footer}>{t('avatarPrivacy')}</Text>
 </>;
 return <SafeAreaView style={[s.safe,{flex:1}]}><View style={{padding:12,maxWidth:1250,width:'100%',alignSelf:'center',flex:1}}>
 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><Text style={[s.sectionTitle,{fontSize:22}]}>{t('modelTitle')}</Text><Pressable accessibilityRole="button" onPress={()=>onClose?onClose():router.push('/')}><Text style={s.link}>{t(onClose?'fitClose':'studioCopy63')}</Text></Pressable></View>
 <View style={s.filters}>{(['model','video','measurements'] as const).map(id=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:tab===id}} onPress={()=>setTab(id)} style={[s.chip,tab===id&&s.chipOn]}><Text style={[s.chipText,tab===id&&s.chipTextOn]}>{t(id==='model'?'model3dTab':id==='video'?'modelVideoTab':'avatarMeasurements')}</Text></Pressable>)}</View>
 {tab==='video'?<ScrollView><ModelVideo/></ScrollView>:<ScrollView ref={roomScroll} scrollEnabled={width<800} style={{flex:1}} contentContainerStyle={{flexDirection:width>=800?'row':'column',gap:16,paddingBottom:24,...(width>=800?{flex:1}:{})}}>
 <View style={width>=800?{flex:1}:{flexShrink:0}}><View style={[s.filters,{paddingVertical:4}]}>{(['female','male'] as const).map(id=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:kind===id}} onPress={()=>setKind(id)} style={[s.chip,kind===id&&s.chipOn]}><Text style={[s.chipText,kind===id&&s.chipTextOn]}>{t(id==='female'?'modelFemale':'modelMale')}</Text></Pressable>)}</View>
 <ModelMannequin measurements={safe} regions={regions} kind={kind} look={look} fallback={preview} height={stageHeight} compact/>
 </View>
{width>=800 ? <ScrollView ref={catalogScroll} style={{flex:1}} contentContainerStyle={{paddingBottom:24}} keyboardShouldPersistTaps="handled">{catalogBody}</ScrollView> : <View style={{flexShrink:0,paddingBottom:24}}>{catalogBody}</View>}</ScrollView>}

 </View></SafeAreaView>;
}
const a=StyleSheet.create({stage:{marginTop:25,padding:18,backgroundColor:'#F0F3ED',borderRadius:18,borderWidth:1,borderColor:palette.line},card:{width:125,padding:12,backgroundColor:'white',borderRadius:12,borderWidth:1,borderColor:palette.line,justifyContent:'center'}});

const avatarStyles=a;
