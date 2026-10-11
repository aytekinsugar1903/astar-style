import {View,Text} from 'react-native';
import type {ModelMannequinProps} from './ModelMannequin.types';
import {useI18n} from '@/i18n/I18nProvider';
export function ModelMannequin({fallback}:ModelMannequinProps){const {t}=useI18n();return <View>{fallback}<Text>{t('modelNativeNotice')}</Text></View>;}
