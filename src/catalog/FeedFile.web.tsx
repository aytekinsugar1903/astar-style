import {useI18n} from '@/i18n/I18nProvider';
import {MAX_FEED_BYTES} from './feed';
export function FeedFile({onText,disabled=false}:{onText:(text:string)=>void;disabled?:boolean}){const {t}=useI18n();return <input aria-label={t('catalogSelectFile')} type="file" accept=".json,.xml,.csv,.txt" disabled={disabled} onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>MAX_FEED_BYTES){onText('');alert(t('catalogTooLarge'));return;}onText(await f.text());e.target.value='';}} style={{width:'100%',fontSize:16,padding:'14px 0',color:'inherit'}}/>;}
