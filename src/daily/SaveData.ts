import {Share} from 'react-native';
export async function saveData(text:string,name:string){await Share.share({message:text,title:name});}
