"""Integration QA using published demonstration inputs; never user photos."""
import urllib.request,json,pathlib,uuid,concurrent.futures,sys
ROOT=pathlib.Path(__file__).resolve().parents[1];API='https://fashn-ai-fashn-vton-1-5.hf.space/gradio_api'
products=json.loads((ROOT/'src/catalog/open-store.json').read_text())
def run(category):
 p=next(p for p in products if p['categoryKey']==category);v=p['variants'][0];paths=[ROOT/'public/tryon/female.webp',ROOT/'public'/v['imageUrl'].lstrip('/')];boundary=uuid.uuid4().hex;body=b''
 for path in paths:body+=f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="{path.name}"\r\nContent-Type: image/png\r\n\r\n'.encode()+path.read_bytes()+b'\r\n'
 body+=f'--{boundary}--\r\n'.encode();uploads=json.load(urllib.request.urlopen(urllib.request.Request(API+'/upload',data=body,headers={'Content-Type':'multipart/form-data; boundary='+boundary}),timeout=35))
 cat='one-pieces' if category=='dress' else 'bottoms' if category=='trousers' else 'tops';req={'data':[{'path':path,'meta':{'_type':'gradio.FileData'}} for path in uploads]+[cat,'model',50,1.5,42,False]}
 event=json.load(urllib.request.urlopen(urllib.request.Request(API+'/call/try_on',data=json.dumps(req).encode(),headers={'Content-Type':'application/json'}),timeout=30))['event_id'];print(category,'queued',flush=True)
 with urllib.request.urlopen(API+'/call/try_on/'+event,timeout=160) as stream:
  kind=''
  for line in stream:
   text=line.decode().strip()
   if text.startswith('event:'):kind=text[6:].strip()
   if text.startswith('data:') and kind=='error':raise RuntimeError(text)
   if text.startswith('data:') and kind=='complete':
    data=json.loads(text[5:]);img=urllib.request.urlopen(data[0]['url'],timeout=30).read();out=ROOT/'docs/qa'/('tryon-'+category+'.webp');out.write_bytes(img);return {'kind':'female','productId':p['id'],'variantIds':[x['id'] for x in p['variants']],'category':category,'inputModel':'FASHN person6','photoType':'model','engine':'FASHN VTON 1.5','result':str(out),'generatedAt':'2026-10-08'}
 raise RuntimeError('No result')
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 for future in [pool.submit(run,cat) for cat in (sys.argv[1:] or ['shirt','dress','trousers'])]:
  try:r=future.result();results.append(r);print('PASS',r,flush=True)
  except Exception as e:print('FAIL',str(e),flush=True)
(ROOT/'docs/qa/tryon-live-results.json').write_text(json.dumps(results,indent=2));print('completed',len(results),flush=True)
