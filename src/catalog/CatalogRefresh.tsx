import {useEffect} from 'react';
import {AppState} from 'react-native';
import {isDemoMode} from '@/lib/supabase';
import {refreshConfiguredSources} from './sources';
export function CatalogRefresh(){useEffect(()=>{if(isDemoMode)return;void refreshConfiguredSources().catch(()=>{});const s=AppState.addEventListener('change',v=>{if(v==='active')void refreshConfiguredSources().catch(()=>{});});const timer=setInterval(()=>void refreshConfiguredSources().catch(()=>{}),60000);return()=>{s.remove();clearInterval(timer);};},[]);return null;}
