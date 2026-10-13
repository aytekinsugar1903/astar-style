import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const server=spawn('node',['scripts/serve-static.mjs','../dist'],{env:{...process.env,PORT:'4176'}});
await new Promise(r=>server.stdout.once('data',r));
const browser=await chromium.launch({executablePath:process.env.WEYRA_CHROMIUM_PATH,headless:true,args:['--no-sandbox','--single-process','--no-zygote','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[];function check(label,value){assert(value,label);checks.push(label);}
try{
 const p=await browser.newPage({viewport:{width:390,height:844}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4176');
 check('Homepage duplicate store shelf removed',await p.getByTestId('store-shelf').count()===0);
 await p.getByTestId('rack-category-tshirt').scrollIntoViewIfNeeded();await p.getByTestId('rack-category-tshirt').click();
 const dialog=p.getByRole('dialog');await dialog.waitFor();
 await p.getByTestId('dressing-stage').waitFor();
 check('Avatar opens from hanger',await dialog.getByRole('button',{name:'Avatarı giydir',exact:true}).isVisible());
 check('Photo demo no longer replaces avatar',await p.getByTestId('photo-tryon').count()===0);
 await p.screenshot({path:'docs/qa/avatar-repaired-mobile.png'});
 const catalog=p.getByTestId('catalog-in-room');await catalog.scrollIntoViewIfNeeded();
 const product=catalog.getByRole('button',{name:'Buttoned V-Neck Short Sleeve T-Shirt',exact:true});
 if(await product.count())await product.click();else await catalog.locator('[role=button]').filter({has:p.locator('img')}).first().click();
 await expect(p.getByTestId('inline-product-detail')).toBeVisible();
 check('Product details stay inside studio',await dialog.count()===1);
 const img=p.getByTestId('inline-product-detail').locator('img').first();await expect(img).toBeVisible();
 check('Actual catalog photograph loads',await img.evaluate(x=>x.complete&&x.naturalWidth>0));
 await p.getByTestId('dressing-stage').scrollIntoViewIfNeeded();await p.screenshot({path:'docs/qa/avatar-repaired-shirt.png'});
 await dialog.getByRole('button',{name:'Erkek',exact:true}).click();
 check('Male model usable',await p.getByTestId('dressing-stage').isVisible());
 check('3D stage is gone',await p.getByTestId('model-3d-stage').count()===0);
 await dialog.getByRole('button',{name:'Kadın',exact:true}).click();
 check('No horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.setViewportSize({width:1200,height:900});await p.screenshot({path:'docs/qa/avatar-repaired-desktop.png'});
 const a=await p.getByTestId('dressing-stage').boundingBox(),b=await catalog.boundingBox();check('Desktop catalog next to avatar',b.x>=a.x+a.width-5);
 check('No runtime errors',errors.length===0);
 await writeFile('docs/qa/avatar-repair-results.json',JSON.stringify({checks,note:'Local web verification; no physical iPhone test.'},null,2));console.log('PASS',checks);
}finally{await browser.close();server.kill();}
