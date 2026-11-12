const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.join(__dirname, '..');
const audit = path.join(root, 'artifacts/recipe-photos');
const {chromium} = require(path.join(root, 'frontend/node_modules/@playwright/test'));
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async () => {
  const records = JSON.parse(fs.readFileSync(path.join(audit,'downloads.json'),'utf8'));
  const htmlPath = path.join(audit,'contact-sheet.html');
  fs.writeFileSync(htmlPath,'<!doctype html><meta charset="utf-8"><title>CookMatch local photo audit</title>');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport:{width:1600,height:1560},deviceScaleFactor:1});
    await page.goto(pathToFileURL(htmlPath).href);
    for (const record of records.filter(r=>r.file)) {
      const fileUrl = pathToFileURL(path.join(root,'frontend/public',record.file.replace(/^\//,''))).href;
      const info = await page.evaluate(async url => {
        const img = new Image(); img.src = url;
        try { await img.decode(); return {width:img.naturalWidth,height:img.naturalHeight}; }
        catch { return {error:'Browser cannot decode this image'}; }
      }, fileUrl);
      Object.assign(record,info);
      record.decodeStatus=info.error?'failed':'valid';
      if (!info.error && (info.width<100 || info.height<75)) { record.decodeStatus='failed'; record.error='Image is too small to identify the dish'; }
    }
    fs.writeFileSync(path.join(audit,'decoded.json'),JSON.stringify(records,null,2)+'\n');
    for(let offset=0;offset<records.length;offset+=25){
      const group=records.slice(offset,offset+25);
      const html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#eee;font-family:Arial}main{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:8px}.tile{height:301px;background:white;overflow:hidden;border:2px solid #777}.tile img{width:100%;height:227px;object-fit:contain;display:block;background:#ddd}p{font-size:13px;line-height:16px;margin:4px}b{font-size:15px}.issue{border-color:#c00}.approx{border-color:#c90}</style><main>${group.map(r=>`<section class="tile ${!r.file||r.decodeStatus==='failed'?'issue':r.observatii?.length?'approx':''}">${r.file&&r.decodeStatus==='valid'?`<img src="${escapeHtml(pathToFileURL(path.join(root,'frontend/public',r.file.replace(/^\//,''))).href)}">`:'<div style="height:227px;background:#fcc">UNAVAILABLE</div>'}<p><b>${r.id}.</b> ${escapeHtml(r.reteta)}<br>${r.width||'?'} × ${r.height||'?'}${r.observatii?.length?' · APPROX':''}</p></section>`).join('')}</main>`;
      await page.setContent(html);
      await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));
      await page.screenshot({path:path.join(audit,`sheet-${String(offset/25+1).padStart(2,'0')}.jpg`),type:'jpeg',quality:90,fullPage:true});
    }
    console.log(JSON.stringify({decoded:records.filter(r=>r.decodeStatus==='valid').length,invalid:records.filter(r=>r.file&&r.decodeStatus!=='valid').map(r=>({id:r.id,name:r.reteta,error:r.error})),sheets:12},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
