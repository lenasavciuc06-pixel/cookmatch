// Treat the supplied JSON as data. Match names, never external catalog IDs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const audit = path.join(root, 'artifacts/recipe-photos');
const destination = path.join(root, 'frontend/public/images/recipes');
const rows = JSON.parse(fs.readFileSync(path.join(audit, 'input/catalog.json'), 'utf8'));
const recipes = JSON.parse(fs.readFileSync(path.join(root, 'backend/Frigider.Api/Data/Seed/recipes.json'), 'utf8')).recipes;
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
const byName = new Map(recipes.map(r => [normalize(r.Name), r]));
if (byName.size !== recipes.length || rows.length !== 300) throw Error('Ambiguous or incomplete catalog');
const plan = rows.map(row => {
  const recipe = byName.get(normalize(row.reteta));
  if (!recipe) throw Error('No recipe matched: ' + row.reteta);
  return { ...row, slug: recipe.Slug, matchedName: recipe.Name };
});
if (new Set(plan.map(row => row.slug)).size !== 300) throw Error('Repeated name association');
const previous = fs.existsSync(path.join(audit, 'downloads.json'))
  ? JSON.parse(fs.readFileSync(path.join(audit, 'downloads.json'), 'utf8')) : [];
const results = new Map(previous.map(row => [row.slug, row]));
fs.mkdirSync(destination, { recursive: true });
function format(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') return 'webp';
  if (/^GIF8[79]a$/.test(bytes.toString('ascii',0,6))) return 'gif';
  if (bytes.toString('ascii',4,8) === 'ftyp' && /avif|avis/.test(bytes.toString('ascii',8,32))) return 'avif';
  throw Error('Response is not a supported raster image (JPEG/PNG/WebP/GIF/AVIF)');
}
function persist() {
  fs.writeFileSync(path.join(audit, 'downloads.json'), JSON.stringify(plan.map(row => results.get(row.slug)).filter(Boolean), null, 2) + '\n');
}
async function retrieve(row) {
  const existing = results.get(row.slug);
  if (existing?.file && fs.existsSync(path.join(root, 'frontend/public', existing.file.replace(/^\//,'')))) return;
  if (process.argv.includes('--retry-network-errors') && existing?.error && existing.error !== 'fetch failed') return;
  let bytes, finalUrl, contentType, origin;
  try {
    if (row.fisier_local) {
      if (!/^imagini-corectate\/[0-9]{3}\.(jpg|png)$/.test(row.fisier_local)) throw Error('Unexpected archive path');
      bytes = fs.readFileSync(path.join(audit, 'local', path.basename(row.fisier_local)));
      origin = 'provided-archive';
    } else {
      const url = new URL(row.imagine_url);
      if (!['http:','https:'].includes(url.protocol)) throw Error('Unsupported image URL protocol');
      let response;
      for (let attempt = 0; attempt < 2; attempt++) {
        response = await fetch(url, {
          signal: AbortSignal.timeout(25000),
          headers: { 'User-Agent': 'Mozilla/5.0 CookMatch-Catalog-Import/1.0', Accept: 'image/avif,image/webp,image/*;q=0.9,*/*;q=0.5', ...(attempt && row.sursa_url ? {Referer: row.sursa_url} : {}) },
        });
        if (response.ok) break;
        await response.body?.cancel();
        if (attempt === 0) await new Promise(r => setTimeout(r, 700));
      }
      if (!response.ok) throw Error(`HTTP ${response.status} ${response.statusText}`);
      finalUrl = response.url;
      contentType = response.headers.get('content-type');
      const declaredSize = Number(response.headers.get('content-length') || 0);
      if (declaredSize > 25 * 1024 * 1024) throw Error('Image exceeds 25 MB');
      bytes = Buffer.from(await response.arrayBuffer());
      origin = 'download';
    }
    if (bytes.length < 100 || bytes.length > 25 * 1024 * 1024) throw Error('Invalid image file size');
    const ext = format(bytes);
    const filename = `${row.slug}.${ext}`;
    fs.writeFileSync(path.join(destination, filename), bytes);
    results.set(row.slug, { ...row, file: `/images/recipes/${filename}`, origin, format: ext, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), finalUrl, contentType, downloadStatus: 'downloaded-awaiting-decode' });
  } catch (error) {
    results.set(row.slug, { ...row, file: null, origin: row.fisier_local ? 'provided-archive' : 'download', downloadStatus: 'failed', error: error.message, cause: error.cause?.message });
  }
}
(async () => {
  let cursor = 0, completed = 0;
  await Promise.all(Array.from({length:6}, async () => {
    while (cursor < plan.length) {
      const row = plan[cursor++];
      await retrieve(row);
      if (++completed % 15 === 0) { persist(); console.log(`Processed ${completed}/300; image files ${[...results.values()].filter(r=>r.file).length}`); }
    }
  }));
  persist();
  console.log(JSON.stringify({total: results.size, imageFiles:[...results.values()].filter(r=>r.file).length, failures:[...results.values()].filter(r=>!r.file).map(r=>({id:r.id,name:r.reteta,error:r.error,cause:r.cause}))}, null, 2));
})().catch(error => { persist(); console.error(error); process.exitCode = 1; });
