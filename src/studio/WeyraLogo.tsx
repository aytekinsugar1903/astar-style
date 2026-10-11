import {useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Easing,Image,StyleSheet,View} from 'react-native';
import {useTheme} from './theme';

export function WeyraLogo(){
 const {dark}=useTheme();const motion=useRef(new Animated.Value(0)).current;const [reduceMotion,setReduceMotion]=useState(true);
 useEffect(()=>{let mounted=true;void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(mounted)setReduceMotion(value);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduceMotion);return()=>{mounted=false;sub.remove();};},[]);
 useEffect(()=>{motion.setValue(0);if(reduceMotion)return;const loop=Animated.loop(Animated.sequence([Animated.timing(motion,{toValue:1,duration:2600,easing:Easing.inOut(Easing.sin),useNativeDriver:false}),Animated.timing(motion,{toValue:-1,duration:5200,easing:Easing.inOut(Easing.sin),useNativeDriver:false}),Animated.timing(motion,{toValue:0,duration:2600,easing:Easing.inOut(Easing.sin),useNativeDriver:false})]));loop.start();return()=>loop.stop();},[reduceMotion,motion]);
 return <View style={[styles.frame,dark&&styles.dark]}><Animated.View testID="weyra-logo-motion" style={{width:110,height:126,transform:[{perspective:800},{translateX:motion.interpolate({inputRange:[-1,1],outputRange:[-3,3]})},{rotateY:motion.interpolate({inputRange:[-1,1],outputRange:['-7deg','7deg']})},{rotateZ:motion.interpolate({inputRange:[-1,1],outputRange:['-1.5deg','1.5deg']})}]}}><Image accessibilityLabel="Weyra" source={require('../../assets/branding/weyra-logo.png')} resizeMode="contain" style={styles.image}/></Animated.View></View>;
}
const styles=StyleSheet.create({frame:{width:130,height:140,alignItems:'center',justifyContent:'center'},dark:{backgroundColor:'#F3F4F0',borderRadius:18},image:{width:'100%',height:'100%'}});
