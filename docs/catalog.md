# Catalogul CookMatch

Catalogul conține 300 de rețete: cele 30 inițiale, cu instrucțiuni dezvoltate individual,
și 270 de variante culinare organizate pe 12 metode (supe, salate, paste, omlete,
cartofi copți, pilaf, tocane, pui la tavă, pește, fructe coapte, pâine prăjită și chiftele).
Variantele au combinații diferite de ingrediente; nu sunt duplicate numerotate.
Textele sunt redactate pentru proiect, în română și engleză.

## Etape

Contractul API rămâne `instructions: string[]`, fără migrare de schemă SQLite.
Formatul fiecărei instrucțiuni din catalog este:

```text
[4 min] Acțiunea, cu metoda, pregătirea și detaliile necesare.
Aspect: Repere de culoare, textură și consistență.
```

În engleză se folosește eticheta `Look for:`. Frontendul afișează separat cele trei
componente și acceptă în continuare instrucțiuni vechi fără acest format.
Suma duratelor este timpul total orientativ, inclusiv pregătire și repaus; duratele
nu sunt cronometre și nu reprezintă rețete testate practic în bucătărie.
La leguminoase, instrucțiunile precizează dacă sunt uscate sau deja fierte.

Temperaturile interne și folosirea termometrului au fost verificate față de
[recomandările FDA](https://www.fda.gov/food/buy-store-serve-safe-food/safe-food-handling)
și [USDA pentru carne și pasăre](https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry).
Reperele vizuale sunt suplimentare, nu înlocuiesc verificarea temperaturii.

## Regenerare și verificare

Din rădăcina proiectului:

```powershell
node scripts/expand-catalog.cjs
node scripts/validate-catalog.cjs
dotnet test backend/Frigider.Api.Tests --no-restore
```

`scripts/original-recipes.json` păstrează cele 30 de definiții inițiale.
`scripts/original-recipe-steps.cjs` conține instrucțiunile dezvoltate pentru acestea.
`scripts/expand-catalog.cjs` definește variantele și metodele noilor rețete.
Validatorul verifică unicitatea, ingredientele, traducerile, etapele și timpii totali.

## Actualizarea bazei existente

Identifică și oprește mai întâi instanța API a proiectului. Păstrează un backup al
bazei existente. Din `backend/Frigider.Api`:

```powershell
dotnet run -- seed --update-instructions
```

Comanda creează un backup SQLite înainte de migrare și importă într-o tranzacție.
Adaugă rețetele lipsă și, numai cu `--update-instructions`, actualizează instrucțiunile
RO/EN și timpul total al rețetelor existente. Păstrează ID-urile, numele, descrierile,
fotografiile și ingredientele existente; nu șterge alte înregistrări. Fără opțiune,
rețetele existente sunt omise. Nu folosi `EnsureDeletedAsync` sau resetarea bazei.
După import pornește o singură instanță API cu `dotnet run`.
