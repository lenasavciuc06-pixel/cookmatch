// Authored recipe variants and cooking methods. No external recipe text is copied.
// Rebuild deterministically from the original 30 recipes; validate with validate-catalog.cjs.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const seedDir = path.join(root, 'backend/Frigider.Api/Data/Seed');
const original = JSON.parse(fs.readFileSync(path.join(__dirname, 'original-recipes.json'), 'utf8')).recipes;
const ingredients = JSON.parse(fs.readFileSync(path.join(seedDir, 'ingredients.json'), 'utf8')).ingredients;
const english = Object.fromEntries(ingredients.map(i => [i.Name, i.Translations.find(t => t.LanguageCode === 'en').Name]));
const en = name => english[name];
const join = (names, lang) => names.map(n => lang === 'en' ? en(n) : n).join(lang === 'en' ? ' and ' : ' și ');
const slug = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const step = (minutes, ro, lookRo, eng, lookEn) => ({ minutes, ro, lookRo, eng, lookEn });
const format = (s, lang) => `[${s.minutes} min] ${lang === 'ro' ? s.ro : s.eng}\n${lang === 'ro' ? 'Aspect' : 'Look for'}: ${lang === 'ro' ? s.lookRo : s.lookEn}`;
const setSteps = (r, steps) => {
  r.Instructions = steps.map(s => format(s, 'ro'));
  r.Translations.en.Instructions = steps.map(s => format(s, 'en'));
  r.PrepTimeMinutes = steps.reduce((sum, s) => sum + s.minutes, 0);
};
const leafy = new Set(['spanac', 'pătrunjel', 'mărar', 'busuioc', 'oregano']);
const finish = new Set(['brânză', 'telemea', 'ricotta', 'mozzarella', 'parmezan', 'iaurt', 'iaurt grecesc', 'smântână', 'pesto', 'lămâie', 'masline', 'ton', 'sardine', ...leafy]);
const legumes = new Set(['fasole', 'năut', 'linte', 'mazăre']);
function qty(n) {
  if (n === 'usturoi') return '2';
  if (n === 'ghimbir') return '10 g';
  if (n === 'rozmarin') return '2 g';
  if (leafy.has(n)) return n === 'oregano' ? '2 g' : '10 g';
  if (['brânză', 'telemea', 'ricotta', 'mozzarella', 'parmezan'].includes(n)) return '80 g';
  if (['iaurt', 'iaurt grecesc', 'smântână'].includes(n)) return '100 g';
  if (n === 'lămâie') return '1';
  if (n === 'masline') return '60 g';
  if (n === 'scorțișoară') return '2 g';
  if (n === 'pesto') return '30 g';
  if (['ton', 'sardine'].includes(n)) return '150 g';
  return '250 g';
}
function items(base, pair) {
  return [...new Map([...base.map(([Name, Quantity]) => ({ Name, Quantity })), ...pair.map(Name => ({ Name, Quantity: qty(Name) }))].map(i => [i.Name, i])).values()];
}
const base = { soup: [['cartofi','150 g'],['ceapă','80 g'],['apă','900 ml'],['ulei','15 ml'],['sare','3 g']], salad: [['ulei','20 ml'],['lămâie','1'],['sare','2 g']], pasta: [['paste','300 g'],['usturoi','2'],['ulei','20 ml'],['apă','2 l'],['sare','5 g']], omelet: [['ouă','6'],['ulei','15 ml'],['sare','2 g']], potato: [['cartofi','800 g'],['ulei','20 ml'],['sare','3 g']], rice: [['orez','240 g'],['ceapă','80 g'],['apă','600 ml'],['ulei','20 ml'],['sare','3 g']], stew: [['ceapă','100 g'],['sos de roșii','250 g'],['apă','300 ml'],['ulei','20 ml'],['sare','3 g']], chicken: [['piept de pui','600 g'],['usturoi','2'],['ulei','20 ml'],['sare','3 g']], fish: [['somon','600 g'],['ulei','20 ml'],['sare','3 g']], fruit: [['zahăr','20 g'],['apă','30 ml']], toast: [['pâine','8 felii'],['ulei','10 ml']], fritter: [['ouă','2'],['făină','100 g'],['lapte','80 ml'],['ulei','30 ml'],['sare','2 g']] };
const images = { soup: original.find(r=>r.Slug==='supa-de-legume-cu-cartofi').ImageUrl, salad: original.find(r=>r.Slug==='salata-de-rosii-si-castraveti').ImageUrl, pasta: original.find(r=>r.Slug==='bolognese-cu-paste').ImageUrl, omelet: original[0].ImageUrl, potato: original.find(r=>r.Slug==='gratin-de-cartofi-cu-branza').ImageUrl, rice: original.find(r=>r.Slug==='mancare-de-ciuperci-cu-orez').ImageUrl, stew: original.find(r=>r.Slug==='mancare-de-linte-cu-cartofi').ImageUrl, chicken: original.find(r=>r.Slug==='gratar-de-pui-cu-legume').ImageUrl, fish: original.find(r=>r.Slug==='orez-cu-legume-si-soia').ImageUrl, fruit: original.find(r=>r.Slug==='prajitura-cu-mere-si-scortisoara').ImageUrl, toast: original[0].ImageUrl, fritter: original.find(r=>r.Slug==='clatite-cu-branza-si-mere').ImageUrl };

function methodTemplate(kind, pair) {
  const ro = join(pair,'ro'), eng = join(pair,'en');
  const raw = pair.filter(n=>!finish.has(n)&&!legumes.has(n));
  const rawRo = join(raw,'ro'), rawEn = join(raw,'en');
  const late = pair.filter(n=>finish.has(n)||legumes.has(n));
  const lateRo=join(late,'ro'), lateEn=join(late,'en');
  switch(kind) {
    case 'soup': return [
      step(8,`Spală și curăță legumele. Taie cartofii și legumele tari în cuburi de 1 cm; pregătește ${ro}. Folosește leguminoase din conservă, clătite și scurse; păstrează frunzele și lactatele pentru final.`,`Cuburile au mărimi apropiate; frunzele sunt curate, fără codițe tari.`,`Wash and peel the vegetables. Cut potatoes and firm vegetables into 1 cm cubes; prepare ${eng}. Use rinsed, drained canned legumes; keep leaves and dairy for the end.`,`Even-sized cubes and clean leaves with tough stalks removed.`),
      step(4,'Încinge uleiul într-o oală, la foc mediu. Adaugă ceapa tocată și amestecă fără să o rumenești.','Ceapa este translucidă și lucioasă, fără margini arse.','Heat the oil in a saucepan over medium heat. Add the chopped onion and stir without browning.','The onion looks translucent and glossy, with no burnt edges.'),
      step(22,`Adaugă cartofii${raw.length?`, ${rawRo}`:''} și apa. Adu la fierbere, redu focul și fierbe cu capacul întredeschis. Adaugă leguminoasele și frunzele în ultimele 3 minute. Verifică legumele cu furculița.`,`Legumele se străpung ușor; lichidul fierbe domol, nu în clocote mari.`,`Add the potatoes${raw.length?`, ${rawEn}`:''} and water. Bring to a boil, lower the heat and simmer partly covered. Add legumes and leaves during the last 3 minutes. Test vegetables with a fork.`,`Vegetables pierce easily; the liquid bubbles gently rather than boiling hard.`),
      step(3,'Oprește focul și lasă aburul să se domolească. Pasează cu blenderul vertical ținut sub suprafață; subțiază cu puțină apă fierbinte dacă este necesar.','Supa curge uniform din lingură, fără bucăți tari sau stropi de ulei separați.','Turn off the heat and let the steam subside. Blend with an immersion blender kept below the surface; loosen with a little hot water if needed.','The soup pours smoothly from a spoon without hard pieces or separated oil.'),
      step(3,'Încorporează lactatele, dacă sunt în lista de ingrediente, după ce ai oprit fierberea. Potrivește sarea și porționează.','Textura este omogenă și cremoasă, iar verdețurile își păstrează culoarea.','Stir in any dairy listed in the ingredients after boiling has stopped. Adjust salt and portion.','The texture is smooth and creamy and the herbs retain their colour.')];
    case 'salad': return [
      step(7,`Spală și usucă ingredientele pentru salata cu ${ro}. Folosește leguminoase fierte din conservă și pește din conservă, dacă apar în listă; scurge-le bine. Nu folosi fasole sau năut uscat direct în salată.`,`Ingredientele sunt curate și bine scurse; nu se adună apă pe fundul bolului.`,`Wash and dry the ingredients for the ${eng} salad. Use cooked canned legumes and canned fish where listed; drain well. Do not use dried beans or chickpeas directly in the salad.`,`The ingredients are clean and well drained, with no water collecting in the bowl.`),
      step(5,`Taie legumele și fructele în bucăți de 1–2 cm, rade fin rădăcinoasele și rupe frunzele. Taie brânza în cuburi, dacă este inclusă. Pune ${ro} într-un bol larg.`,`Bucățile sunt potrivite pentru o îmbucătură; frunzele și ingredientele moi nu sunt zdrobite.`,`Cut vegetables and fruit into 1–2 cm pieces, finely grate roots and tear leaves. Cube any cheese. Place ${eng} in a wide bowl.`,`Pieces are bite-sized; leaves and soft ingredients are not crushed.`),
      step(2,'Amestecă uleiul cu sucul unei jumătăți de lămâie și sarea. Gustă dressingul și adaugă restul de lămâie numai dacă dorești mai multă aciditate.','Dressingul este tulbure și ușor legat, fără strat gros de ulei deasupra.','Whisk the oil with the juice of half the lemon and the salt. Taste and add more lemon only if you want more acidity.','The dressing is cloudy and lightly emulsified, without a thick oil layer.'),
      step(2,'Toarnă dressingul și amestecă de jos în sus. Servește imediat; păstrează separat dressingul dacă pregătești salata în avans.','Fiecare bucată este ușor lucioasă, iar salata rămâne aerată și crocantă.','Pour over the dressing and fold from the bottom. Serve straight away; keep dressing separate if making ahead.','Every piece is lightly glossy and the salad stays loose and crisp.')];
    case 'pasta': return [
      step(8,`Pregătește ${ro}: taie legumele tari în cuburi de 5 mm, feliază ciupercile și mărunțește usturoiul. Folosește leguminoase și pește din conservă, deja pregătite pentru consum. Ține-le separat, alături de brânzeturi și verdețuri.`,`Bucățile mici se vor găti uniform; ingredientele de final nu sunt amestecate cu cele crude.`,`Prepare ${eng}: dice firm vegetables into 5 mm cubes, slice mushrooms and chop garlic. Use cooked canned legumes and ready-to-eat canned fish. Keep them separate along with cheese and herbs.`,`Small pieces will cook evenly; finishing ingredients are separate from raw vegetables.`),
      step(12,`Încălzește uleiul într-o tigaie largă. Gătește ${raw.length?rawRo:'legumele din listă'} la foc mediu; pune usturoiul în ultimul minut. Dacă tigaia se usucă, adaugă câte 30 ml apă.`,`Legumele sunt fragede, cu margini ușor aurii, iar usturoiul miroase plăcut și nu este brun închis.`,`Warm the oil in a wide pan. Cook ${raw.length?rawEn:'the listed vegetables'} over medium heat; add garlic during the final minute. If the pan dries out, add water 30 ml at a time.`,`Vegetables are tender with lightly golden edges; garlic smells fragrant and is not dark brown.`),
      step(8,'Adu cei 2 litri de apă la fierbere într-o oală încăpătoare și adaugă sarea. Păstrează sosul la foc foarte mic.','Apa clocotește uniform; sosul rămâne umed, fără să se lipească.','Bring the 2 litres of water to a rolling boil in a large pot and add salt. Keep the sauce over very low heat.','Water boils steadily and the sauce stays moist without sticking.'),
      step(10,'Fierbe pastele conform timpului de pe ambalaj, de regulă 8–12 minute. Gustă o bucată înainte de scurgere și păstrează 150 ml apă de la fierbere.','Pastele sunt flexibile și ferme la mușcătură, fără miez făinos tare.','Cook pasta for the package time, usually 8–12 minutes. Taste before draining and reserve 150 ml cooking water.','Pasta is flexible and firm to the bite, with no hard chalky centre.'),
      step(3,`Amestecă pastele în tigaie${late.length?` cu ${lateRo}`:''}. Pune verdețurile și brânzeturile după oprirea focului și adaugă treptat apa păstrată.`,`Sosul îmbracă pastele într-un strat lucios; nu există o baltă de apă pe fundul farfuriei.`,`Toss pasta in the pan${late.length?` with ${lateEn}`:''}. Add herbs and cheese off the heat and loosen gradually with reserved water.`,`A glossy sauce coats the pasta without a puddle of water beneath it.`)];
    case 'omelet': return [
      step(6,`Pregătește ${ro}. Spală legumele, taie-le în bucăți mici și rade brânza dacă este inclusă. Bate ouăle cu sarea numai până se omogenizează.`,`Amestecul de ou este uniform, fără fire mari de albuș; legumele sunt tăiate egal.`,`Prepare ${eng}. Wash vegetables, cut small and grate any cheese. Beat eggs with salt just until combined.`,`Eggs are evenly mixed without large streaks of white; vegetables are evenly cut.`),
      step(8,`Încinge uleiul într-o tigaie antiaderentă de 24 cm. Înmoaie legumele la foc mediu, adăugând frunzele doar în ultimul minut. Păstrează brânza și ierburile fragede pentru ouă.`,`Legumele sunt fragede și tigaia nu mai conține lichid în exces.`,`Heat oil in a 24 cm nonstick pan. Soften vegetables over medium heat, adding leaves only for the last minute. Keep cheese and delicate herbs for the eggs.`,`Vegetables are tender and excess liquid has evaporated.`),
      step(8,'Toarnă ouăle, distribuie ingredientele de final și redu focul. Acoperă și gătește până când centrul este închegat; verifică 71°C în centru cu termometrul, prelungind timpul dacă este necesar.','Suprafața nu mai are ou lichid, iar baza este aurie, fără crustă arsă.','Pour in eggs, scatter finishing ingredients and reduce heat. Cover and cook until the centre sets; verify 71°C in the centre with a thermometer, allowing extra time if needed.','No liquid egg remains on top and the underside is golden without a burnt crust.'),
      step(2,'Oprește focul, desprinde marginile cu o spatulă și taie porții fără să presezi omleta.','Felii moi și bine legate, cu legumele distribuite uniform.','Turn off the heat, loosen the edges with a spatula and slice without pressing the omelet.','Slices are tender and set, with vegetables evenly distributed.')];
    case 'potato': return [
      step(10,'Încălzește cuptorul la 210°C. Spală cartofii, usucă-i și taie-i în felii groase de 1,5 cm. Amestecă-i cu uleiul și sarea.','Feliile au grosimi apropiate și un strat subțire de ulei.','Preheat the oven to 210°C. Wash and dry potatoes and cut into 1.5 cm thick slices. Toss with oil and salt.','Slices are similar in thickness and lightly coated with oil.'),
      step(30,'Așază cartofii pe o tavă, într-un singur strat, și coace-i. Întoarce-i la jumătatea timpului; verifică centrul cu o furculiță și prelungește coacerea dacă este tare.','Marginile sunt aurii, iar furculița intră ușor în mijloc.','Spread potatoes in a single layer on a tray and roast, turning halfway through. Test the centres with a fork and cook longer if firm.','Edges are golden and a fork slips easily into the middle.'),
      step(8,`Pregătește ${ro}: toacă legumele mărunt, rade brânza și scurge leguminoasele deja fierte sau peștele din conservă, după caz. Frunzele și ierburile se pun la servire.`,`Umplutura este bine scursă, fără bucăți mari sau exces de lichid.`,`Prepare ${eng}: chop vegetables small, grate cheese and drain cooked legumes or canned fish as appropriate. Keep leaves and herbs for serving.`,`Toppings are well drained with no oversized pieces or excess liquid .`),
      step(8,`Distribuie ingredientele pregătite peste cartofii copți, în afară de frunzele fragede, și mai coace 8 minute.`,`Brânza, dacă este inclusă, s-a topit; toppingul este fierbinte și cartofii rămân aurii.`,`Scatter prepared toppings over the roasted potatoes, except delicate leaves, and bake for another 8 minutes.`,`Any cheese has melted; toppings are hot and potatoes remain golden.`),
      step(3,'Lasă tava să se odihnească, apoi adaugă ierburile sau dressingul rece din ingredientele alese. Servește fără să acoperi etanș cartofii.','Cartofii își păstrează marginile crocante, iar verdețurile sunt proaspete.','Let the tray rest, then add herbs or cold dressing from the selected ingredients. Serve without covering potatoes tightly.','Potatoes keep their crisp edges and herbs look fresh.')];
    case 'rice': return [
      step(8,`Clătește orezul până când apa devine aproape limpede. Toacă ceapa și pregătește ${ro}; taie legumele în cuburi de aproximativ 1 cm.`,`Orezul nu mai lasă apă foarte lăptoasă, iar legumele au dimensiuni apropiate.`,`Rinse rice until the water is almost clear. Chop onion and prepare ${eng}; cut vegetables into roughly 1 cm cubes.`,`The rinse water is no longer very milky and vegetables are similarly sized.`),
      step(5,'Încinge uleiul într-o cratiță cu capac. Călește ceapa și legumele tari la foc mediu, amestecând; păstrează ierburile, frunzele și brânzeturile pentru final.','Ceapa este translucidă și legumele au suprafețe lucioase, fără să fie arse.','Heat oil in a lidded saucepan. Soften onion and firm vegetables over medium heat, stirring; reserve herbs, leaves and cheese for the finish.','Onion is translucent and vegetable surfaces are glossy, not burnt.'),
      step(2,'Adaugă orezul scurs și amestecă astfel încât fiecare bob să atingă uleiul.','Boabele sunt lucioase și se mișcă separat în cratiță.','Add drained rice and stir to coat every grain in oil.','Grains are glossy and move separately around the pan.'),
      step(18,'Adaugă apa și sarea, adu la fierbere, apoi acoperă și redu focul la minimum. Folosește orez alb cu timp de fierbere de 15–20 minute; adaugă leguminoasele din conservă și frunzele în ultimele 3 minute.','Apa este absorbită, boabele sunt umflate și fragede; nu rămâne un miez tare.','Add water and salt, bring to a boil, cover and turn heat to its lowest setting. Use white rice with a 15–20 minute cooking time; add canned legumes and leaves for the final 3 minutes.','Water is absorbed and grains are plump and tender without a hard centre.'),
      step(5,'Oprește focul și lasă orezul acoperit. Nu amesteca în timpul odihnei.','Suprafața devine uniformă și aburul continuă să se distribuie sub capac.','Turn off the heat and leave rice covered. Do not stir while it rests.','The surface settles evenly while steam distributes under the lid.'),
      step(2,`Afânează cu o furculiță și adaugă ingredientele de final${late.length?` (${lateRo})`:''}.`,`Boabele se separă ușor, fără să devină pastă; verdețurile sunt încă vii la culoare.`,`Fluff with a fork and add finishing ingredients${late.length?` (${lateEn})`:''}.`,`Grains separate easily without turning mushy and herbs retain their colour.`)];
    case 'stew': return [
      step(8,`Pregătește ${ro}. Taie legumele în cuburi de 1 cm. Pentru fasole, năut, linte sau mazăre folosește variante din conservă, deja fierte, clătite și scurse.`,`Legumele sunt uniforme, iar leguminoasele sunt moi înainte de a intra în cratiță.`,`Prepare ${eng}. Cut vegetables into 1 cm cubes. For beans, chickpeas, lentils or peas use cooked, rinsed, drained canned varieties.`,`Vegetables are evenly sized and legumes are already tender before going into the pan.`),
      step(5,'Călește ceapa tocată în ulei, într-o cratiță largă, la foc mediu. Amestecă periodic pentru a nu se lipi.','Ceapa este moale și ușor aurie; fundul cratiței nu are depuneri arse.','Soften chopped onion in oil in a wide saucepan over medium heat. Stir occasionally to prevent sticking.','Onion is soft and lightly golden; the pan bottom has no burnt deposits.'),
      step(20,`Adaugă sosul de roșii, apa${raw.length?` și ${rawRo}`:''}. Fierbe la foc mic, cu capacul întredeschis, până când legumele sunt fragede. Dacă toate ingredientele alese sunt deja fierte, lasă doar sosul să scadă.`,`Sosul s-a îngroșat ușor, iar legumele se străpung cu furculița.`,`Add tomato sauce, water${raw.length?` and ${rawEn}`:''}. Simmer partly covered until vegetables are tender. If all selected ingredients are already cooked, let just the sauce reduce.`,`Sauce is slightly thickened and vegetables can be pierced with a fork .`),
      step(7,`Adaugă leguminoasele fierte și ingredientele din conservă, dacă apar în listă. Amestecă delicat și încălzește-le în sos, fără să le zdrobești.`,`Sosul aderă la ingrediente, iar boabele își păstrează forma.`,`Add cooked legumes and canned ingredients where listed. Fold gently and heat through in the sauce without crushing.`,`Sauce clings to the ingredients and legumes hold their shape.`),
      step(3,'Oprește focul. Adaugă ierburile, brânzeturile sau sucul de lămâie numai dacă sunt în lista rețetei, apoi potrivește sarea.','Tocana este legată, cu puțin sos în jurul porției și culori distincte.','Turn off the heat. Add herbs, cheese or lemon juice only if listed, then adjust salt.','The stew is cohesive, with a little sauce around each portion and distinct colours.')];
    case 'chicken': return [
      step(10,`Pregătește ${ro} pe un tocător curat. Taie legumele tari în bucăți de 1,5 cm. Separat, taie pieptul de pui în fâșii de 2–3 cm; spală mâinile și ustensilele după contactul cu carnea crudă.`,`Legumele și carnea au bucăți uniforme și sunt ținute separat până la asamblare.`,`Prepare ${eng} on a clean board. Cut firm vegetables into 1.5 cm pieces. On a separate board cut chicken breast into 2–3 cm strips; wash hands and utensils after handling raw chicken.`,`Vegetable and chicken pieces are uniform and kept separate until assembly.`),
      step(10,'Încălzește cuptorul la 200°C. Amestecă puiul cu uleiul, usturoiul mărunțit și sarea; adaugă condimentele sau iaurtul numai dacă sunt în listă.','Carnea este acoperită uniform cu un strat subțire de marinadă.','Preheat the oven to 200°C. Toss chicken with oil, chopped garlic and salt; add spices or yogurt only if listed.','Chicken is evenly coated in a thin layer of marinade.'),
      step(25,`Așază puiul și legumele tari într-un singur strat într-o tavă. Coace și întoarce la jumătatea timpului; adaugă frunzele, ierburile sau brânza în ultimele 3 minute. Verifică 74°C în cea mai groasă bucată de pui; prelungește coacerea dacă nu a ajuns la temperatură.`,`Suprafața este ușor rumenită, iar legumele sunt fragede. Aspectul nu înlocuiește verificarea cu termometrul.`,`Arrange chicken and firm vegetables in a single layer on a tray. Roast, turning halfway through; add leaves, herbs or cheese for the last 3 minutes. Verify 74°C in the thickest chicken piece and cook longer if necessary.`,`The surface is lightly browned and vegetables are tender. Appearance does not replace a thermometer check.`),
      step(5,'Lasă carnea să se odihnească pe o farfurie curată. Nu o pune pe tocătorul folosit pentru puiul crud.','Bucățile își păstrează sucul, fără o baltă mare de lichid pe farfurie.','Rest the meat on a clean plate. Do not place it on the board used for raw chicken.','Pieces retain their juices rather than leaving a large puddle on the plate.'),
      step(3,'Porționează puiul alături de legume și adaugă ingredientele proaspete din listă.','Porții echilibrate, cu legume vizibile și carne ușor rumenită.','Portion chicken alongside vegetables and add the listed fresh finishing ingredients.','Balanced portions with visible vegetables and lightly browned chicken.')];
    case 'fish': return [
      step(8,`Pregătește ${ro}, tăind legumele tari în felii de 5 mm. Pentru leguminoase folosește variante fierte din conservă, scurse. Verifică fileurile de somon pentru oase și tamponează-le cu hârtie de bucătărie.`,`Fileurile sunt uscate la suprafață, fără oase evidente, iar legumele au felii subțiri.`,`Prepare ${eng}, slicing firm vegetables 5 mm thick. Use drained cooked canned legumes where listed. Check salmon fillets for bones and pat dry with kitchen paper.`,`Fillets are dry on the surface with no obvious bones; vegetables are thinly sliced.`),
      step(10,'Încălzește cuptorul la 200°C. Unge o tavă cu puțin din ulei și pregătește patru fileuri de grosime apropiată.','Tava este unsă uniform și fileurile nu sunt suprapuse.','Preheat the oven to 200°C. Brush a tray with a little oil and prepare four fillets of similar thickness.','The tray is evenly oiled and fillets do not overlap.'),
      step(raw.length ? 15 : 3,`Pune în tavă doar legumele tari, amestecate cu restul uleiului și sare. Precoace-le; dacă varianta aleasă conține numai ingrediente moi, păstrează-le deoparte și folosește etapa pentru pregătirea porțiilor și verificarea oaselor.`,`Legumele tari încep să se înmoaie; ingredientele delicate nu sunt uscate în cuptor.`,`Place only firm vegetables in the tray with remaining oil and salt. Pre-roast them; if the selected variant has only soft ingredients, keep them aside and use this stage to portion fish and check for bones.`,`Firm vegetables begin to soften; delicate ingredients have not dried out in the oven .`),
      step(18,`Adaugă somonul și ingredientele moi lângă legume. Coace până când centrul atinge 63°C, măsurat cu termometrul; fileurile groase pot necesita câteva minute în plus. Pune ierburile la final.`,`Peștele devine opac și se desface în foi la atingerea furculiței, fără margini foarte uscate.`,`Add salmon and soft ingredients beside the vegetables. Bake until the centre reaches 63°C on a food thermometer; thick fillets may need extra minutes. Add herbs at the end.`,`Fish turns opaque and flakes under a fork without overly dry edges.`),
      step(3,'Scoate tava și porționează cu o spatulă lată, adăugând lămâia sau lactatele numai dacă sunt prevăzute în rețetă.','Fileurile rămân întregi, cu interior umed și garnitură bine distribuită.','Remove the tray and portion with a broad spatula, adding lemon or dairy only if listed.','Fillets stay intact, with a moist interior and evenly distributed accompaniments.')];
    case 'fruit': return [
      step(8,`Spală și pregătește ${ro}. Scoate sâmburii, cotoarele și cojile necomestibile. Taie fructele în felii groase de 1 cm; păstrează lactatele pentru servire.`,`Feliile au grosimi apropiate și nu au cotoare sau sâmburi tari.`,`Wash and prepare ${eng}. Remove stones, cores and inedible peel. Cut fruit into 1 cm thick slices; keep dairy for serving.`,`Slices are similarly thick with no tough cores or stones.`),
      step(10,'Încălzește cuptorul la 180°C. Așază fructele într-un vas mic, adaugă apa și presară zahărul și scorțișoara dacă este inclusă.','Fructele formează un strat nu foarte gros, cu puțin lichid pe fund.','Preheat the oven to 180°C. Place fruit in a small baking dish, add water and sprinkle with sugar and any listed cinnamon.','Fruit forms a shallow layer with a little liquid at the bottom.'),
      step(25,'Coace până când fructele se înmoaie; întoarce-le delicat după 15 minute. Dacă se usucă prea repede, adaugă o lingură de apă.','Marginile sunt ușor caramelizate, iar o furculiță intră fără rezistență în fructele tari.','Bake until fruit softens, turning gently after 15 minutes. If it dries too quickly, add a tablespoon of water.','Edges are lightly caramelised and a fork slides into firm fruit without resistance.'),
      step(5,'Lasă vasul să se răcorească înainte de servire. Adaugă iaurtul sau brânza din listă abia după acest repaus.','Sucul este ușor siropos și lactatele rămân cremoase, fără să se separe.','Let the dish cool slightly before serving. Add any listed yogurt or cheese only after this rest.','Juices are lightly syrupy and dairy remains creamy without splitting.')];
    case 'toast': return [
      step(5,`Pregătește ${ro}. Spală și taie ingredientele proaspete, scurge peștele sau leguminoasele din conservă și mărunțește brânza dacă este inclusă.`,`Toppingul este bine scurs și bucățile sunt mici, ușor de așezat pe pâine.`,`Prepare ${eng}. Wash and cut fresh ingredients, drain canned fish or legumes and crumble any cheese.`,`Toppings are well drained and cut small enough to sit on the bread.`),
      step(4,'Unge feliile de pâine cu ulei și rumenește-le într-o tigaie la foc mediu, aproximativ 2 minute pe fiecare parte.','Pâinea este aurie și crocantă la suprafață, fără colțuri negre.','Brush bread slices with oil and toast in a pan over medium heat, about 2 minutes per side.','Bread is golden and crisp on the surface with no blackened corners.'),
      step(3,`Distribuie ${ro} pe pâine. Dacă folosești avocado, pasează-l grosier; zdrobește ușor leguminoasele ca să nu alunece.`,`Stratul de topping este uniform și aderă la felii, fără să le îmbibe excesiv.`,`Distribute ${eng} over the toast. Roughly mash any avocado; lightly crush legumes so they do not roll off.`,`Toppings form an even layer that stays on the bread without soaking it.`),
      step(2,'Taie feliile în jumătăți și servește imediat, adăugând frunzele proaspete la final.','Baza este încă fermă și crocantă, iar toppingul este proaspăt.','Halve the slices and serve immediately, adding fresh leaves last.','The base remains firm and crisp and toppings look fresh.')];
    case 'fritter': return [
      step(8,`Pregătește ${ro}. Rade rădăcinoasele și dovleceii, toacă fin ciupercile, varza, broccoli și frunzele. Folosește mazăre și porumb deja fierte, scurse și zdrobite grosier. Scurge bine legumele apoase și mărunțește brânza separat.`,`Bucățile sunt mici, iar legumele nu lasă o baltă de lichid în bol.`,`Prepare ${eng}. Grate roots and zucchini; finely chop mushrooms, cabbage, broccoli and leaves. Use cooked, drained, roughly crushed peas and sweetcorn. Squeeze watery vegetables and crumble cheese separately.`,`Pieces are small and vegetables leave no puddle of liquid in the bowl.`),
      step(8,'Înmoaie legumele tari sau ciupercile într-o tigaie cu o linguriță din ulei. Legumele fragede pot fi lăsate crude, bine scurse. Lasă ingredientele încălzite să se răcorească înainte de a pune ouăle.','Legumele tari nu mai sunt crocante, iar compoziția nu este fierbinte.','Soften firm vegetables or mushrooms in a pan with a teaspoon of the oil. Tender vegetables can stay raw if well drained. Let heated ingredients cool before adding eggs.','Firm vegetables are no longer crunchy and the mixture is not hot.'),
      step(3,'Amestecă ouăle cu laptele, făina și sarea, apoi încorporează ingredientele pregătite. Nu lucra excesiv aluatul.','Compoziția cade greu din lingură și păstrează legumele suspendate, fără făină uscată.','Mix eggs, milk, flour and salt, then fold in prepared ingredients. Avoid overworking the batter.','Batter drops slowly from a spoon and holds vegetables suspended with no dry flour.'),
      step(12,'Încinge restul de ulei la foc mediu și formează chiftele plate de maximum 1 cm grosime. Gătește în două tranșe, circa 3 minute pe fiecare parte; verifică 71°C în centru și prelungește gătirea dacă este necesar.','Ambele fețe sunt aurii, iar centrul este închegat, fără aluat umed.','Heat remaining oil over medium heat and spoon in flat fritters no more than 1 cm thick. Cook in two batches, about 3 minutes per side; verify 71°C in the centre and cook longer if needed.','Both sides are golden and the centre is set without wet batter.'),
      step(2,'Scoate chiftelele pe o farfurie cu hârtie absorbantă, fără să le suprapui imediat.','Suprafața nu este uleioasă, iar marginile rămân ușor crocante.','Transfer fritters to a plate lined with kitchen paper without stacking straight away.','Surfaces are not greasy and edges remain lightly crisp.')];
  }
  throw Error('Unknown method '+kind);
}

// Remove optional directions when the chosen ingredients do not need them.
function method(kind, pair) {
  const steps = methodTemplate(kind, pair);
  const pulses = pair.filter(n => legumes.has(n));
  const leaves = pair.filter(n => leafy.has(n));
  const dairy = pair.filter(n => ['smântână','iaurt','iaurt grecesc','ricotta','telemea','brânză','parmezan','mozzarella'].includes(n));
  if (kind === 'soup') {
    const extras = [...pulses, ...leaves];
    steps[0].ro = `Spală și curăță legumele pentru supa cu ${join(pair,'ro')}. Taie cartofii și legumele tari în cuburi de 1 cm.${pulses.length ? ` Folosește ${join(pulses,'ro')} din conservă, deja fierte, clătite și scurse.` : ''}${leaves.length ? ' Spală frunzele și păstrează-le pentru finalul fierberii.' : ''}${dairy.length ? ' Păstrează lactatele pentru după oprirea focului.' : ''}`;
    steps[0].eng = `Wash and peel vegetables for the ${join(pair,'en')} soup. Cut potatoes and firm vegetables into 1 cm cubes.${pulses.length ? ` Use cooked canned ${join(pulses,'en')}, rinsed and drained.` : ''}${leaves.length ? ' Wash leaves and keep them for the end of simmering.' : ''}${dairy.length ? ' Reserve dairy until after the heat is turned off.' : ''}`;
    steps[0].lookRo = 'Legumele sunt curate, cu bucăți de mărimi apropiate, pentru o fierbere uniformă.';
    steps[0].lookEn = 'Vegetables are clean and cut into similarly sized pieces for even cooking.';
    steps[2].ro = steps[2].ro.replace('Adaugă leguminoasele și frunzele în ultimele 3 minute. ',extras.length ? `Adaugă ${join(extras,'ro')} în ultimele 3 minute. ` : '');
    steps[2].eng = steps[2].eng.replace('Add legumes and leaves during the last 3 minutes. ',extras.length ? `Add ${join(extras,'en')} for the last 3 minutes. ` : '');
    steps[4].ro = `${dairy.length ? `Încorporează ${join(dairy,'ro')} după ce ai oprit fierberea, amestecând continuu. ` : ''}Gustă supa, potrivește sarea și porționează în boluri încălzite.`;
    steps[4].eng = `${dairy.length ? `Stir in ${join(dairy,'en')} after boiling has stopped, stirring continuously. ` : ''}Taste, adjust salt and portion into warmed bowls.`;
    steps[4].lookRo = 'Textura este omogenă, fără cocoloașe sau lichid separat pe marginea bolului.';
    steps[4].lookEn = 'The texture is uniform without lumps or separated liquid around the bowl.';
  }
  if (kind === 'pasta' && pair.every(n => finish.has(n) || legumes.has(n))) {
    steps[1] = step(2,'Încălzește uleiul la foc mic, adaugă usturoiul pentru 30 secunde, apoi 3 linguri de apă. Oprește focul până fierb pastele; ingredientele delicate se vor încorpora la final.','Usturoiul este deschis la culoare și tigaia conține puțin lichid aromat, fără zone arse.','Warm oil over low heat, add garlic for 30 seconds and then 3 tablespoons of water. Turn off heat until pasta is cooked; delicate ingredients will be folded in at the end.','Garlic stays pale and the pan contains a little fragrant liquid with no burnt areas.');
  }
  if (kind === 'rice') {
    const heated = pair.filter(n => legumes.has(n) || n === 'spanac');
    const fresh = pair.filter(n => finish.has(n) && n !== 'spanac');
    steps[3].ro = 'Adaugă apa și sarea, adu la fierbere, apoi acoperă și redu focul la minimum. Folosește orez alb cu timp de fierbere de 15–20 minute.' + (heated.length ? ` Adaugă ${join(heated,'ro')} în ultimele 3 minute; leguminoasele trebuie să fie deja fierte, din conservă.` : '');
    steps[3].eng = 'Add water and salt, bring to a boil, cover and turn the heat to its lowest setting. Use white rice with a 15–20 minute cooking time.' + (heated.length ? ` Add ${join(heated,'en')} for the final 3 minutes; legumes must be cooked canned varieties.` : '');
    steps[5].ro = `Afânează cu o furculiță, fără să zdrobești boabele.${fresh.length ? ` Încorporează ${join(fresh,'ro')} și amestecă delicat.` : ' Porționează cu o lingură largă.'}`;
    steps[5].eng = `Fluff with a fork without crushing the grains.${fresh.length ? ` Fold in ${join(fresh,'en')} and mix gently.` : ' Portion with a broad spoon.'}`;
  }
  if (kind === 'stew' && !pulses.length) {
    steps[3] = step(7,'Descoperă cratița și lasă sosul să scadă puțin. Amestecă delicat de la fund și redu focul dacă începe să se lipească.','Sosul aderă la legume, iar bucățile rămân întregi, fără lichid foarte subțire.','Uncover the pan and let the sauce reduce slightly. Stir gently from the bottom and lower the heat if it starts to catch.','Sauce clings to vegetables and pieces remain intact without watery liquid.');
  }
  return steps;
}

// Each row is a different ingredient combination, not a numbered duplicate.
const variants = {
 soup: `dovleac,morcovi;dovleac,ghimbir;dovleac,linte;morcovi,păstârnac;morcovi,țelină;mazăre,spanac;mazăre,mărar;mazăre,iaurt;dovlecei,busuioc;dovlecei,mazăre;ciuperci,smântână;ciuperci,țelină;roșii,busuioc;roșii,linte;roșii,ardei;fasole,roșii;fasole,varză;năut,morcovi;năut,spanac;linte,morcovi;linte,păstârnac;păstârnac,țelină;păstârnac,mere;spanac,ricotta;spanac,usturoi;ardei,morcovi;ardei,telemea;varză,roșii;varză,morcovi;dovlecei,smântână`,
 salad: `roșii,telemea;castraveți,iaurt;avocado,roșii;avocado,ton;avocado,năut;fasole,ceapă roșie;fasole,ardei;fasole,castraveți;năut,castraveți;năut,ardei;năut,telemea;linte,roșii;linte,morcovi;linte,ceapă roșie;varză,morcovi;varză,mere;spanac,mere;spanac,telemea;spanac,portocale;roșii,mozzarella;roșii,ton;castraveți,sardine;ridiche,castraveți;ridiche,telemea;morcovi,mere;morcovi,portocale;mazăre,telemea;mazăre,castraveți;pere,ricotta;roșii,masline`,
 pasta: `roșii,mozzarella;roșii,ton;roșii,sardine;roșii,masline;roșii,ricotta;roșii,spanac;ciuperci,spanac;ciuperci,smântână;ciuperci,parmezan;ciuperci,mazăre;dovlecei,ricotta;dovlecei,telemea;dovlecei,pesto;dovlecei,roșii;dovlecei,parmezan;spanac,ricotta;spanac,smântână;spanac,mozzarella;mazăre,ricotta;mazăre,parmezan;ardei,roșii;ardei,telemea;ardei,masline;ardei,ciuperci;dovleac,ricotta;dovleac,parmezan;linte,roșii;năut,spanac;fasole,roșii;morcovi,mazăre`,
 omelet: `ciuperci,spanac;ciuperci,telemea;ciuperci,ardei;dovlecei,brânză;dovlecei,mărar;dovlecei,roșii;spanac,ricotta;spanac,mozzarella;roșii,telemea;roșii,busuioc;ardei,mozzarella;ardei,ceapă roșie;mazăre,brânză;mazăre,mărar;porumb,telemea;roșii,masline;ciuperci,parmezan;dovlecei,parmezan;spanac,ceapă roșie;ardei,brânză`,
 potato: `ciuperci,mozzarella;ciuperci,smântână;ciuperci,spanac;roșii,telemea;roșii,mozzarella;roșii,masline;spanac,ricotta;spanac,brânză;năut,roșii;fasole,sos de roșii;ton,ceapă roșie;ton,mozzarella;mazăre,telemea;ardei,brânză;ardei,ciuperci;dovlecei,parmezan;linte,roșii;broccoli,brânză;ceapă roșie,telemea;ricotta,mărar`,
 rice: `ciuperci,spanac;ciuperci,mazăre;ciuperci,parmezan;dovlecei,roșii;dovlecei,telemea;ardei,mazăre;ardei,morcovi;morcovi,mazăre;spanac,năut;spanac,ricotta;linte,roșii;fasole,ardei;roșii,ton;roșii,mozzarella;dovleac,parmezan;dovleac,mazăre;broccoli,morcovi;broccoli,brânză;mazăre,mărar;roșii,busuioc`,
 stew: `năut,spanac;năut,dovlecei;năut,ardei;năut,ciuperci;năut,dovleac;năut,morcovi;fasole,ardei;fasole,ciuperci;fasole,varză;fasole,dovlecei;fasole,spanac;fasole,țelină;linte,ardei;linte,ciuperci;linte,dovleac;linte,spanac;linte,morcovi;linte,varză;mazăre,morcovi;mazăre,ciuperci;mazăre,dovlecei;mazăre,ardei;cartofi,ciuperci;cartofi,ardei;cartofi,dovlecei;varză,ciuperci;dovleac,ciuperci;țelină,morcovi;păstârnac,morcovi;broccoli,năut`,
 chicken: `ardei,dovlecei;ciuperci,smântână;roșii,mozzarella;roșii,busuioc;morcovi,țelină;cartofi,rozmarin;dovleac,morcovi;broccoli,ardei;ciuperci,spanac;iaurt,lămâie;roșii,masline;dovlecei,parmezan;ardei,ceapă roșie;cartofi,oregano;ciuperci,morcovi;dovleac,ceapă roșie;broccoli,parmezan;dovlecei,telemea;roșii,ricotta;țelină,păstârnac`,
 fish: `lămâie,mărar;roșii,masline;dovlecei,roșii;broccoli,morcovi;cartofi,pătrunjel;ardei,ceapă roșie;spanac,smântână;iaurt,lămâie;mazăre,mărar;ciuperci,usturoi;roșii,busuioc;dovleac,morcovi;dovlecei,telemea;broccoli,lămâie;năut,roșii;fasole,ardei;țelină,păstârnac;cartofi,rozmarin;mazăre,ricotta;roșii,mozzarella`,
 fruit: `mere,scorțișoară;mere,pere;mere,ricotta;mere,iaurt;mere,portocale;pere,scorțișoară;pere,ricotta;pere,iaurt grecesc;pere,portocale;banane,scorțișoară;banane,ricotta;banane,iaurt;banane,mere;banane,pere;portocale,scorțișoară;portocale,ricotta;portocale,iaurt grecesc;mere,iaurt grecesc;pere,brânză;banane,iaurt grecesc`,
 toast: `avocado,roșii;avocado,telemea;roșii,mozzarella;ton,castraveți;sardine,ceapă roșie;năut,ardei;fasole,roșii;ricotta,pere;telemea,castraveți;avocado,spanac`,
 fritter: `dovlecei,telemea;dovlecei,mărar;dovlecei,parmezan;morcovi,brânză;morcovi,pătrunjel;ciuperci,spanac;ciuperci,telemea;spanac,ricotta;spanac,parmezan;mazăre,mărar;mazăre,telemea;porumb,brânză;broccoli,parmezan;broccoli,telemea;dovleac,ricotta;dovleac,brânză;varză,mărar;varză,morcovi;ardei,mozzarella;dovlecei,ceapă roșie`,
};

const labels = { soup:['Supă cremă de','Creamy soup with','Soup'],salad:['Salată cu','Salad with','Salad'],pasta:['Paste cu','Pasta with','Pasta'],omelet:['Omletă cu','Omelet with','Breakfast'],potato:['Cartofi copți cu','Roast potatoes with','Dinner'],rice:['Pilaf cu','Rice pilaf with','Lunch'],stew:['Tocană de','Stew with','Budget'],chicken:['Piept de pui la tavă cu','Tray-baked chicken breast with','Meat'],fish:['Somon la cuptor cu','Baked salmon with','Dinner'],fruit:['Fructe coapte cu','Baked fruit with','Dessert'],toast:['Pâine prăjită cu','Toast with','Quick'],fritter:['Chiftele la tigaie cu','Pan-fried fritters with','Vegetarian'] };

// Ingredients needed by the new variants, added to the existing catalog without renaming entries.
for (const [Name, NameEn] of [['ghimbir','ginger'],['porumb','sweetcorn'],['broccoli','broccoli'],['rozmarin','rosemary']]) {
  if (!english[Name]) { ingredients.push({Name,IsPantryStaple:false,Translations:[{LanguageCode:'en',Name:NameEn}]}); english[Name]=NameEn; }
}
leafy.add('rozmarin'); finish.add('rozmarin');

const added = [];
for (const [kind, rows] of Object.entries(variants)) {
  const pairKeys = new Set();
  for (const row of rows.split(';')) {
    const pair=row.split(',');
    const pairKey=[...pair].sort().join('|');
    if(pairKeys.has(pairKey))throw Error(`Repeated combination in ${kind}: ${row}`);
    pairKeys.add(pairKey);
    if (pair.some(n=>!english[n])) throw Error('Unknown ingredient '+row);
    const [roName,enName,Category]=labels[kind];
    const Name=`${roName} ${join(pair,'ro')}`;
    const recipe={Slug:slug(Name),Name,Description:`${Name}, pentru o masă de acasă. Etape cu durate orientative, cantități pentru 4 porții și repere de textură la fiecare etapă.`,ImageUrl:images[kind],Category,PrepTimeMinutes:0,Difficulty:'Easy',Servings:4,Ingredients:items(base[kind],pair),Instructions:[],Translations:{en:{Name:`${enName} ${join(pair,'en')}`,Description:`${enName} ${join(pair,'en')} for a home-cooked meal, with quantities for 4 servings, estimated stage times and texture cues.`,Instructions:[]}}};
    setSteps(recipe,method(kind,pair));
    added.push(recipe);
  }
}

// Original recipes receive individually authored, expanded methods below.
const originalSteps = require('./original-recipe-steps.cjs');
for (const r of original) {
  if (!originalSteps[r.Slug]) throw Error('Missing original method: '+r.Slug);
  setSteps(r,originalSteps[r.Slug].map(s=>step(...s)));
}
const recipes=[...original,...added];
if(recipes.length!==300)throw Error(`Expected 300 recipes, got ${recipes.length}`);
if(new Set(recipes.map(r=>r.Slug)).size!==300)throw Error('Duplicate recipe slugs');
fs.writeFileSync(path.join(seedDir,'ingredients.json'),JSON.stringify({ingredients},null,2)+'\n');
fs.writeFileSync(path.join(seedDir,'recipes.json'),JSON.stringify({recipes},null,2)+'\n');
console.log(`Catalog: ${original.length} existing + ${added.length} new = ${recipes.length}; ${ingredients.length} ingredients.`);
require('./translate-catalog-ru.cjs')();
