import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect,useState} from 'react';
import {emptyDaily,validateDaily,type DailyState,type SavedLook} from './logic';
export const DAILY_KEY='weyra:daily:v1';
const listeners=new Set<()=>void>();let writes=Promise.resolve();
export const notifyDaily=()=>listeners.forEach(fn=>fn());
export async function readDaily(){const raw=await AsyncStorage.getItem(DAILY_KEY);if(!raw)return emptyDaily();const parsed=JSON.parse(raw);if(!validateDaily(parsed))throw new Error('dailyStorageError');return parsed;}
export function changeDaily(update:(state:DailyState)=>DailyState){const result=writes.then(async()=>{const next=update(await readDaily());if(!validateDaily(next))throw new Error('dailyStorageError');await AsyncStorage.setItem(DAILY_KEY,JSON.stringify(next));listeners.forEach(fn=>fn());return next;});writes=result.then(()=>{},()=>{});return result;}
export async function readLooks():Promise<SavedLook[]>{const raw=await AsyncStorage.getItem('weyra:looks:v2');const value=raw?JSON.parse(raw):[];if(!Array.isArray(value)||!value.every(l=>l&&typeof l.id==='string'&&typeof l.title==='string'&&l.placed&&typeof l.placed==='object'&&!Array.isArray(l.placed)&&Object.values(l.placed).every((p:any)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y))))throw new Error('dailyStorageError');return value;}
export function useDaily(){const [state,setState]=useState(emptyDaily),[error,setError]=useState(''),[ready,setReady]=useState(false);useEffect(()=>{let active=true;const refresh=()=>{void readDaily().then(v=>{if(active){setState(v);setError('');}}).catch(()=>active&&setError('dailyStorageError')).finally(()=>active&&setReady(true));};listeners.add(refresh);refresh();return()=>{active=false;listeners.delete(refresh);};},[]);return{state,error,ready};}
