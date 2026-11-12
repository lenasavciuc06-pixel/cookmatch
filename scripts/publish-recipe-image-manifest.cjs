const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const audit = path.join(root,'artifacts/recipe-photos');
const docs = path.join(root,'docs/recipe-images');
const records = JSON.parse(fs.readFileSync(path.join(audit,'decoded.json'),'utf8'));
const review = JSON.parse(fs.readFileSync(path.join(docs,'review.json'),'utf8'));
const manifest = {};
const sources = [];
for(const record of records){
  const reason=review.rejected[String(record.id)];
  const notes=[...(record.observatii||[])];
  if(review.additionalApproximationNotes[record.id])notes.push(review.additionalApproximationNotes[record.id]);
  const available=!!record.file && record.decodeStatus==='valid' && !reason;
  const status=available ? notes.length?'accepted-approximation':'accepted-general-match' : reason?'rejected-visual-match':'download-failed';
  manifest[record.slug]=available?{file:record.file,width:record.width,height:record.height}:{file:null};
  if(reason&&record.file){
    const from=path.join(root,'frontend/public',record.file.replace(/^\//,''));
    const to=path.join(audit,'rejected',path.basename(record.file));
    fs.mkdirSync(path.dirname(to),{recursive:true});
    if(fs.existsSync(from))fs.renameSync(from,to);
  }
  sources.push({...record,assignedFile:manifest[record.slug].file,reviewStatus:status,reviewNotes:notes,rejectionReason:reason,visibleTextOrCollage:review.visibleTextOrCollage.includes(record.id),licenseStatus:'unverified',reviewScope:review.scope});
}
if(Object.keys(manifest).length!==300)throw Error('Incomplete recipe image manifest');
const available=sources.filter(r=>r.assignedFile);
const problems=sources.filter(r=>!r.assignedFile);
const approximations=available.filter(r=>r.reviewStatus==='accepted-approximation');
fs.writeFileSync(path.join(root,'frontend/src/assets/recipe-photos.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(docs,'sources.json'),JSON.stringify(sources,null,2)+'\n');
const lines=[
  '# Imaginile rețetelor CookMatch','',
  `- Rețete asociate după nume: **300**.`,
  `- Fotografii atribuite: **${available.length}** (arhivă: ${available.filter(r=>r.origin==='provided-archive').length}; descărcate: ${available.filter(r=>r.origin==='download').length}).`,
  `- Linkuri indisponibile: **${problems.filter(r=>r.reviewStatus==='download-failed').length}**.`,
  `- Fișiere excluse la revizuirea vizuală: **${problems.filter(r=>r.reviewStatus==='rejected-visual-match').length}**.`,
  `- Potriviri aproximative păstrate, cu observații: **${approximations.length}**.`,
  '- Licențele de reutilizare sunt **neverificate**, conform informațiilor primite. Această integrare nu reprezintă o autorizare de reutilizare/publicare.',
  '- Fișierele au fost păstrate în formatul și rezoluția descărcate, fără redimensionare sau conversie. Afișarea folosește decupare centrală 4:3, fără deformare.',
  '- Pentru intrările indisponibile sau respinse se afișează „Imagine indisponibilă”; nu se folosesc fotografiile comune vechi ca înlocuitor.',
  '- `sources.json` păstrează pentru toate cele 300 de intrări ID-ul de catalog extern, numele, slugul local, linkul original, pagina sursă, observațiile primite, hashul, dimensiunile și rezultatul verificării.',
  '- `frontend/src/assets/recipe-photos.json` este asocierea separată după slug, utilizată de carduri și detalii în ambele limbi.',
  '', '## Probleme rămase','',
  ...problems.map(r=>`- **${r.reteta}** (catalog ${r.id}): ${(r.rejectionReason||r.error).trim().replace(/\.$/,'')}. [Pagina sursă](${r.sursa_url})`),
  '', '## Potriviri aproximative','',
  ...approximations.map(r=>`- **${r.reteta}** (catalog ${r.id}): ${r.reviewNotes.join(' ')} [Sursă](${r.sursa_url})`),
  '', '## Limitele verificării','',review.scope,
  'Unele fotografii conțin text, filigrane sau colaje; aceste cazuri sunt marcate în sources.json. Nu au fost eliminate sau retușate aceste elemente.',
  '', '## Actualizare reproductibilă','',
  'Datele de intrare și rezultatele descărcărilor sunt în artifacts/recipe-photos. Importul nu execută HTML sau instrucțiuni din fișierele furnizate. Ordinea verificării este: import-recipe-images.cjs, audit-recipe-images.cjs, revizuirea planșelor, apoi publish-recipe-image-manifest.cjs. Reintroducerea unui fișier respins necesită actualizarea explicită a review.json și o nouă verificare.',
];
fs.writeFileSync(path.join(docs,'README.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({assigned:available.length,local:available.filter(r=>r.origin==='provided-archive').length,downloaded:available.filter(r=>r.origin==='download').length,problems:problems.length,approximations:approximations.length},null,2));
