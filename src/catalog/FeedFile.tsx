import {Text} from 'react-native';
import {useI18n} from '@/i18n/I18nProvider';
export function FeedFile({onText,disabled=false}:{onText:(text:string)=>void;disabled?:boolean}){const {t}=useI18n();return <Text>{t('catalogPasteNative')}</Text>;}
