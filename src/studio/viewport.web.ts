import {useEffect,useState} from 'react';
// Some mobile browsers report a zero visual viewport during hydration.
// Keep the scene usable and update it when the viewport or keyboard changes.
const measure=()=>typeof window==='undefined'?{width:390,height:844}:{width:window.visualViewport?.width||window.innerWidth,height:window.visualViewport?.height||window.innerHeight};
export function useViewport(){const [size,setSize]=useState({width:390,height:844});useEffect(()=>{const update=()=>setSize(measure());update();window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);return()=>{window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);};},[]);return size;}
