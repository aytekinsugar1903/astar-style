import type {ReactNode} from 'react';
import type {BodyRegions} from './avatarShape';
import type {ModelKind,ModelLook,ModelMeasures} from './mannequin';
export type ModelMannequinProps={height?:number;compact?:boolean;measurements:ModelMeasures;regions:BodyRegions;kind:ModelKind;look:ModelLook;fallback:ReactNode};
