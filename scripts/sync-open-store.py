"""Curate openly licensed retailer catalog; keep only single-colour products.
No marketplace scraping. Download publisher's MIT dataset and original images.
"""
import urllib.request,json,pathlib,concurrent.futures,hashlib,datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
URL='https://raw.githubusercontent.com/arturayupov/womens-fashion-catalog-open-data/main/'
raw=json.load(urllib.request.urlopen(URL+'data/products.json',timeout=40))
maptypes={'T-Shirt':('tshirt','crew'),'Shirt':('shirt','classic'),'Button-Down Shirt':('shirt','classic'),'Blouse':('shirt','classic'),'Sweater':('knit','crew'),'Cardigan':('knit','cardigan'),'Knit Top':('knit','crew'),'Jacket':('jacket','blazer'),'Blazer':('jacket','blazer'),'Coat':('jacket','utility'),'Pants':('trousers','tailored'),'Jeans':('trousers','denim'),'Midi Dress':('dress','midi'),'Maxi Dress':('dress','maxi'),'Dress':('dress','mini'),'Mini Dress':('dress','mini'),'Skirt':('skirt','midi'),'Maxi Skirt':('skirt','midi'),'Shoes':('shoes','sneaker'),'Handbag':('bag','shoulder'),'Bag':('bag','shoulder'),'Shoulder Bag':('bag','shoulder'),'Crossbody Bag':('bag','shoulder'),'Belt':('accessory','belt'),'Necklace':('accessory','belt')}
counts={};chosen=[]
for p in raw:
 kind=maptypes.get(p['product_type'])
 if not kind:continue
 cat,subtype=kind
 variants=p.get('variants',[])
 colours={v.get('options',{}).get('Color','') for v in variants}
 if len(colours)!=1 or not variants or counts.get(cat,0)>=12:continue
 imgs=[i['url'] for i in p.get('images',[]) if not any(k in i['url'] for k in ['-v2-','-v3-','-v4-'])]
 if not imgs:continue
 chosen.append((p,cat,subtype,imgs[:2]));counts[cat]=counts.get(cat,0)+1
assetdir=ROOT/'public/store';assetdir.mkdir(parents=True,exist_ok=True)
def download(item):
 p,cat,subtype,imgs=item;paths=[]
 for i,url in enumerate(imgs):
  name=p['id']+'-'+str(i)+'.webp';dest=assetdir/name
  try:
   # Shopify image CDN width transform preserves source picture.
   data=urllib.request.urlopen(url+('&' if '?' in url else '?')+'width=720',timeout=35).read()
   if len(data)<1000:continue
   dest.write_bytes(data);paths.append('/store/'+name)
  except Exception as e:print('image failed',p['id'],str(e),flush=True)
 if not paths:return None
 variants=[]
 for v in p['variants']:
  opt=v.get('options',{});variants.append({'id':'livo-'+v['sku'],'color':opt.get('Color',''),'size':opt.get('Size',''),'imageUrl':paths[0],'images':paths,'price':v.get('price_usd'),'currency':'USD','inStock':v.get('in_stock'),'productUrl':p['url']})
 return {'id':'livo-'+p['id'],'sourceId':'livostyle-open','sourceName':'Livostyle','sourceUrl':'https://github.com/arturayupov/womens-fashion-catalog-open-data','externalId':p['id'],'name':p['title'],'brand':p.get('vendor') or 'Livostyle','category':p['product_type'],'categoryKey':cat,'subtype':subtype,'pattern':p.get('metafields',{}).get('pattern','Solid').lower(),'variants':variants,'importedAt':p.get('updated_at') or '2026-09-01T00:00:00Z','material':p.get('metafields',{}).get('material',''),'fit':p.get('metafields',{}).get('fit',''),'care':p.get('metafields',{}).get('care',''),'license':'MIT','credit':'Arcada LLC / Livostyle','creditUrl':'https://github.com/arturayupov/womens-fashion-catalog-open-data','photoType':'model','imageSources':imgs[:len(paths)]}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:products=[p for p in ex.map(download,chosen) if p]
(ROOT/'src/catalog/open-store.json').write_text(json.dumps(products,ensure_ascii=False,indent=2))
(ROOT/'public/store/LICENSE.txt').write_bytes(urllib.request.urlopen(URL+'LICENSE',timeout=25).read())
(ROOT/'public/store/PROVENANCE.json').write_text(json.dumps({'publisher':URL,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'products':len(products),'note':'Curated single-colour products. Original image URLs retained in open-store.json; prices and stock are source snapshots, not live availability.'},indent=2))
print('IMPORTED',len(products),counts,flush=True)
