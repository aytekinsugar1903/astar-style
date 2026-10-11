import {sampleGarments} from '../studio/closet';
import type {CatalogProduct} from './types';
export const photoCatalog:CatalogProduct[]=sampleGarments.map(p=>({id:p.id,source:'open-photo',merchant:p.credit??'Wikimedia Commons',name:p.name,brand:p.brand??'Wikimedia Commons',category:p.category,color:p.colors.join(' / '),styleTags:[],price:0,currency:'TRY',priceKnown:false,stockKnown:false,styleScoreKnown:false,inStock:false,styleScore:72,productUrl:p.creditUrl??'',photoSource:p.source,credit:p.credit,creditUrl:p.creditUrl,license:p.license,categoryKey:p.category}));
