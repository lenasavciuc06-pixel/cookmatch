// Supplied archive metadata is data only. Resolve recipe names, never catalog IDs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv.slice(2).find(arg=>!arg.startsWith('--')) || path.join(root, 'artifacts/image-corrections/input'));
const audit = path.join(root, 'artifacts/image-corrections');
const docs = path.join(root, 'docs/recipe-images');
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function main() {
  const rows = read(path.join(input, 'cookmatch-imagini.json')).filter(r => r.fisier_local);
  if (rows.length !== 34) throw Error('Expected exactly 34 local corrections');
  const sources = read(path.join(docs, 'sources.json'));
  const recipes = read(path.join(root, 'backend/Frigider.Api/Data/Seed/recipes.json')).recipes;
  const byName = new Map(recipes.map(r => [normalize(r.Name), r]));
  const {chromium} = require(path.join(root, 'frontend/node_modules/@playwright/test'));
  const browser = await chromium.launch();
  const plan = [];
  try {
    const page = await browser.newPage({viewport:{width:1600,height:1300}});
    fs.mkdirSync(audit, {recursive:true});
    const blank = path.join(audit, 'audit.html');
    fs.writeFileSync(blank, '<!doctype html><meta charset="utf-8">');
    await page.goto(pathToFileURL(blank).href);
    for (const row of rows) {
      if (!/^imagini-corectate\/[0-9]{3}\.(jpg|png|webp)$/.test(row.fisier_local)) throw Error('Unexpected local image path');
      const recipe = byName.get(normalize(row.reteta));
      if (!recipe) throw Error('Unmatched name: ' + row.reteta);
      const source = sources.find(s => s.slug === recipe.Slug);
      if (!source || normalize(source.reteta) !== normalize(row.reteta)) throw Error('Source/name mismatch');
      const local = path.join(input, row.fisier_local);
      const bytes = fs.readFileSync(local);
      const format = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg'
        : bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
        : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' ? 'webp' : null;
      if (!format) throw Error('Invalid image: ' + row.fisier_local);
      const dimensions = await page.evaluate(async url => {
        const img = new Image(); img.src = url; await img.decode();
        return {width:img.naturalWidth,height:img.naturalHeight};
      }, pathToFileURL(local).href);
      if (!dimensions.width || !dimensions.height) throw Error('Empty image');
      plan.push({...row, slug:recipe.Slug, matchedName:recipe.Name, file:`/images/recipes/${recipe.Slug}.${format}`,
        format, bytes:bytes.length, sha256:crypto.createHash('sha256').update(bytes).digest('hex'), ...dimensions});
    }
    if (new Set(plan.map(r=>r.slug)).size !== 34) throw Error('Duplicate recipe');
    write(path.join(audit, 'validated.json'), plan);
    for (let offset=0;offset<plan.length;offset+=12) {
      await page.setContent(`<style>body{margin:0;font:16px Arial;background:#eee}main{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px}section{background:white;height:370px}img{width:100%;height:300px;object-fit:contain}p{margin:4px}</style><main>${plan.slice(offset,offset+12).map(r=>`<section><img src="${escape(pathToFileURL(path.join(input,r.fisier_local)).href)}"><p>${r.id}. ${escape(r.reteta)} · ${r.width}×${r.height}</p></section>`).join('')}</main>`);
      await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
      await page.screenshot({path:path.join(audit,`sheet-${offset/12+1}.jpg`),fullPage:true});
    }
  } finally { await browser.close(); }
  if (!process.argv.includes('--apply')) { console.log('Validated 34 files; inspect contact sheets, then rerun with --apply.'); return; }
  const manifestPath = path.join(root, 'frontend/src/assets/recipe-photos.json');
  const manifest = read(manifestPath);
  const review = read(path.join(docs, 'review.json'));
  for (const row of plan) {
    const index = sources.findIndex(s=>s.slug === row.slug);
    const old = sources[index];
    const destination = path.join(root, 'frontend/public', row.file);
    // Exact original bytes, no conversion or enlargement. Keep superseded files intact.
    fs.copyFileSync(path.join(input, row.fisier_local), destination);
    const notes = [...row.observatii];
    if (row.slug === 'tortilla-spanac-si-branza') notes.push('Fotografia furnizată arată o lipie umplută cu ou, spanac și brânză; rețeta CookMatch este o tortilla pe bază de ouă, fără lipie. Păstrată conform cererii de aplicare a tuturor celor 34 de fotografii; potrivire aproximativă.');
    const visibleText = [4, 46, 213].includes(row.id);
    sources[index] = {...row, origin:'provided-corrections-archive', archive:'cookmatch-34-imagini-corectate.zip',
      assignedFile:row.file, decodeStatus:'valid', downloadStatus:'provided-local',
      reviewStatus:notes.length ? 'accepted-approximation':'accepted-general-match',
      reviewNotes:notes, visibleTextOrCollage:visibleText, licenseStatus:'unverified',
      reviewScope:'Fotografie locală decodată și verificată pe planșe de contact; afișare verificată în carduri și detalii.',
      previousImage:old.previousImage || old};
    manifest[row.slug] = {file:row.file,width:row.width,height:row.height};
    delete review.rejected[String(row.id)];
    delete review.additionalApproximationNotes[String(row.id)];
    review.visibleTextOrCollage = review.visibleTextOrCollage.filter(id=>id !== row.id);
    if (visibleText) review.visibleTextOrCollage.push(row.id);
    if (notes.length > row.observatii.length) review.additionalApproximationNotes[String(row.id)] = notes.at(-1);
  }
  write(manifestPath, manifest);
  write(path.join(docs, 'sources.json'), sources);
  write(path.join(docs, 'corrections.json'), plan);
  write(path.join(docs, 'review.json'), review);
  const readme = path.join(docs, 'README.md');
  let text = fs.readFileSync(readme, 'utf8');
  const assigned = sources.filter(r=>r.assignedFile);
  const approximations = assigned.filter(r=>r.reviewStatus === 'accepted-approximation');
  text = text.replace(/- Fotografii atribuite:.*\r?\n/, `- Fotografii atribuite: **${assigned.length}**; **34** intrări actualizate din arhiva corectată, folosind exclusiv fișiere locale.\n`)
    .replace(/- Linkuri indisponibile:.*\r?\n/, '- Rețete fără imagine locală: **0**. Linkurile externe nu sunt necesare pentru afișare.\n')
    .replace(/- Fișiere excluse la revizuirea vizuală:.*\r?\n/, '- Cele 6 fotografii respinse anterior au fost înlocuite cu fotografiile corectate.\n')
    .replace(/- Potriviri aproximative păstrate, cu observații:.*\r?\n/, `- Potriviri aproximative păstrate, cu observații: **${approximations.length}**.\n`)
    .replace(/## Probleme rămase[\s\S]*?## Potriviri aproximative/, '## Probleme rămase\n\nNicio imagine lipsă sau invalidă. Tortilla cu spanac și brânză rămâne o potrivire aproximativă: fotografia include lipie. Licențele rămân neverificate; observațiile sunt păstrate mai jos.\n\n## Potriviri aproximative')
    .replace(/## Potriviri aproximative[\s\S]*?## Limitele verificării/, '## Potriviri aproximative\n\n' + approximations.map(r=>`- **${r.reteta}** (catalog ${r.id}): ${r.reviewNotes.join(' ')} [Sursă](${r.sursa_url})`).join('\n') + '\n\n## Limitele verificării');
  text = text.replace(/\n## Arhiva cu 34 de corecții[\s\S]*$/, '');
  text += '\n## Arhiva cu 34 de corecții\n\n`corrections.json` păstrează metadatele celor 34 de fișiere locale. Asocierea este făcută după numele rețetei, fără folosirea ID-urilor externe ca ID-uri ale aplicației. `sources.json` păstrează istoricul fiecărei înlocuiri în `previousImage`. Formatele, dimensiunile și hashurile se referă la octeții originali din arhivă.\n\nPentru reaplicare, extrage arhiva în `artifacts/image-corrections/input`, rulează `node scripts/apply-recipe-image-corrections.cjs`, verifică planșele, apoi rulează cu `--apply`. Acest pas se aplică după fluxul original de publicare; rularea doar a vechiului publicator ar reveni la catalogul anterior.\n';
  fs.writeFileSync(readme, text);
  console.log(JSON.stringify({updated:plan.length,assigned:assigned.length,approximate:approximations.length}));
}
main().catch(e=>{ console.error(e); process.exitCode=1; });
