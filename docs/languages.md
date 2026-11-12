# Limbile CookMatch

CookMatch acceptă română (`ro`), engleză (`en`) și rusă (`ru`). Selectorul RO / EN / RU este disponibil în navigarea desktop și în meniul mobil. Preferința se păstrează local; parametrul `?lang=ru` are prioritate la deschiderea paginii. Atributul HTML `lang` se actualizează împreună cu interfața. Dacă stocarea locală este blocată, schimbarea funcționează în sesiunea curentă.

Cele cinci fișiere din `frontend/src/i18n/locales/ru/` acoperă interfața, inclusiv încărcarea, erorile, stările goale și formele de plural. Catalogul include denumiri, descrieri și 1.416 etape în rusă pentru toate cele 300 de rețete; duratele și identitatea rețetelor sunt păstrate. Fotografiile se asociază în continuare după slug.

API-ul acceptă `language=ru` pentru catalog, detalii și ingrediente, respectiv `language: "ru"` pentru potrivire. Căutarea tratează majusculele chirilice în .NET, deoarece SQLite nu le convertește implicit prin `lower()`. Potrivirea și filtrarea recunosc denumirile traduse ale ingredientelor. Cantitățile din detalii au unitățile traduse. Datele introduse manual de utilizator nu sunt traduse automat.

## Întreținerea catalogului

`scripts/translate-catalog-ru.cjs` adaugă numai versiunile rusești în fișierele seed. Cele 30 de rețete originale au etape separate în `scripts/original-recipe-steps-ru.cjs`; variantele folosesc metode specifice preparatului. Regenerarea prin `scripts/expand-catalog.cjs` reaplică și traducerile rusești. Validarea catalogului verifică toate cele trei limbi și păstrarea duratelor.

Pentru o bază existentă, oprește instanța backend identificată, apoi rulează din `backend/Frigider.Api`:

```powershell
dotnet run -- seed
dotnet run
```

Comanda `seed` creează mai întâi un backup SQLite și adaugă traducerile lipsă într-o tranzacție. Nu șterge baza și nu suprascrie traducerile existente sau câmpurile personalizate. Nu este necesar `--update-instructions` pentru adăugarea unei limbi noi. Backupurile rămân locale și sunt excluse din Git.
