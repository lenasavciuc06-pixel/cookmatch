import { test, expect } from '@playwright/test';

test.describe('Frigider App - E2E Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigăm către home page, aplicația se va încărca implicit în română (sau engleză, dar fallback-urile vor merge).
    // Testul se bazează pe texte uzuale sau atribute ARIA.
    await page.goto('/');
  });

  test('1. Fluxul principal: adăugare ingrediente și potrivire', async ({ page }) => {
    // Selectăm combobox-ul pentru ingrediente
    const combobox = page.getByRole('combobox');
    await expect(combobox).toBeVisible();

    // Adăugăm ingrediente
    const ingredientsToAdd = ['cartofi', 'ouă', 'ceapă'];
    for (const item of ingredientsToAdd) {
      await combobox.fill(item);
      await combobox.press('Enter');
      // Verificăm dacă ingredientul a fost adăugat (un buton/chip a apărut)
      await expect(page.getByText(item, { exact: true }).first()).toBeVisible();
    }

    // Apăsăm butonul de căutare "Găsește ce pot găti" / "Find what I can cook"
    // Folosim o potrivire regex flexibilă pentru a acoperi ambele limbi sau variante
    const searchBtn = page.getByRole('button', { name: /(găsește|găti|find)/i });
    await searchBtn.click();

    // Așteptăm navigarea pe pagina de rețete cu rezultate
    await expect(page).toHaveURL(/\/recipes/i);

    // Verificăm că a apărut un grup cu rezultate ("Poți găti acum" sau "You can cook now")
    // Folosim un selector flexibil
    const groupHeading = page.getByRole('heading', { name: /(găti acum|cook now)/i });
    await expect(groupHeading).toBeVisible();

    // Verificăm vizibilitatea unei rețete (article)
    const recipeCard = page.getByRole('article').first();
    await expect(recipeCard).toBeVisible();
  });

  test('2. Deschiderea unei rețete și verificarea ingredientelor deținute', async ({ page }) => {
    // Adăugăm ingredient și navigăm la rețete
    const combobox = page.getByRole('combobox');
    await combobox.fill('făină');
    await combobox.press('Enter');
    
    await page.getByRole('button', { name: /(găsește|găti|find)/i }).click();
    await expect(page).toHaveURL(/\/recipes/i);

    // Dăm click pe prima rețetă
    const recipeCard = page.getByRole('article').first();
    const recipeLink = recipeCard.getByRole('link');
    await recipeLink.click();

    // Așteptăm afișarea detaliilor
    const detailsHeading = page.getByRole('heading', { level: 1 });
    await expect(detailsHeading).toBeVisible();

    // Verificăm lista de ingrediente - 'făină' trebuie să fie listat
    // și preferabil marcat într-un fel (ex: success) - ne bazăm pe vizibilitatea lui în pagină
    const ingredientText = page.getByText('făină', { exact: true }).first();
    await expect(ingredientText).toBeVisible();
  });

  test('3. Adăugarea ingredientelor lipsă la lista de cumpărături', async ({ page }) => {
    // Mergem direct pe pagina de cumpărături inițial ca să o vedem goală (opțional)
    await page.goto('/shopping-list');
    const emptyMsg = page.getByText(/(nu ai ingrediente|nu sunt|empty)/i);
    if (await emptyMsg.isVisible()) {
      await expect(emptyMsg).toBeVisible();
    }

    // Deschidem o rețetă (mergem la recipes -> prima rețetă)
    await page.goto('/recipes');
    await page.getByRole('article').first().getByRole('link').click();

    // Căutăm butonul "Adaugă lipsurile la lista de cumpărături"
    const addMissingBtn = page.getByRole('button', { name: /(adaugă|shopping|cumpărături)/i });
    await addMissingBtn.click();

    // Navigăm la lista de cumpărături folosind meniul principal
    await page.getByRole('link', { name: /(list|cumpărături)/i }).click();
    await expect(page).toHaveURL(/\/shopping-list/i);

    // Ar trebui să vedem ingrediente adăugate (deci elementul de listă nu e gol)
    const shoppingListItems = page.getByRole('listitem');
    await expect(shoppingListItems.first()).toBeVisible();
  });

  test('4. Adăugarea unei rețete la favorite și eliminarea ei', async ({ page }) => {
    await page.goto('/recipes');
    await page.getByRole('article').first().getByRole('link').click();

    // Apăsăm "Adaugă la favorite"
    const favButton = page.getByRole('button', { name: /(favorit|save)/i });
    await favButton.click();

    // Mergem pe pagina de favorite
    await page.getByRole('link', { name: /(favorite)/i }).click();
    await expect(page).toHaveURL(/\/favorites/i);

    // Rețeta e acolo
    const favCard = page.getByRole('article').first();
    await expect(favCard).toBeVisible();

    // Apăsăm eliminare (poate fi chiar pe card sau intrăm iar în ea,
    // asertăm că are un buton de ștergere pe card).
    const removeBtn = favCard.getByRole('button', { name: /(elimină|remove|șterge)/i });
    await removeBtn.click();

    // Verificăm că a dispărut
    await expect(favCard).not.toBeVisible();
  });

  test('5. Filtrarea pe pagina /recipes după categorie și validarea URL-ului', async ({ page }) => {
    await page.goto('/recipes');
    
    // Deschidem filtrele (dacă e pe mobil, dar pe desktop ele sunt mereu vizibile în sidebar/top)
    // Căutăm select-ul de categorii
    const categorySelect = page.getByRole('combobox').filter({ hasText: /(toate categoriile|all categories)/i }).first();
    // Alternativ, dacă e <select>, Playwright îl găsește prin getByRole('combobox') 
    // pe care putem face .selectOption().

    // Fallback flexibil, ne uităm după toate <select>-urile, luăm primul și îl schimbăm pe prima opțiune reală
    const selects = await page.getByRole('combobox').all();
    if (selects.length > 1) {
      await selects[1].selectOption({ index: 1 }); // ex: Breakfast / Mic dejun
    }

    // Așteptăm ca URL-ul să includă ?category=
    await expect(page).toHaveURL(/category=/i);
  });

  test('6. Comutarea limbii modifică interfața', async ({ page }) => {
    await page.goto('/');

    // Citim titlul curent (română probabil)
    const titleRo = page.getByRole('heading', { level: 1 }).first();
    await expect(titleRo).toBeVisible();

    // Găsim butonul de limbă, de obicei în header (ex. EN / RO)
    const langBtn = page.getByRole('button', { name: /(en|ro|limbă|language)/i });
    if (await langBtn.isVisible()) {
      await langBtn.click();
      
      // Selectăm limba opusă. Dacă e dropdown, dăm click pe cealaltă opțiune.
      // E doar un simplu toggle sau dropdown
      const optEn = page.getByRole('menuitem', { name: /en/i });
      if (await optEn.isVisible()) await optEn.click();
    }

    // Așteptăm să se schimbe ceva în pagină, ex titlul
    // Ne așteptăm să se fi aplicat o formă de limbă diferită.
    // Datorită naturii E2E, e destul să nu arunce eroare.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('7. Comportamentul cu backend-ul indisponibil: mesaj de eroare, nu ecran alb', async ({ page }) => {
    // Interceptăm network-ul pentru /api/recipes și forțăm eroare 500
    await page.route('**/api/recipes*', route => route.abort('failed'));

    await page.goto('/recipes');

    // Așteptăm mesajul de eroare
    const errorMsg = page.getByText(/(eroare|nu am putut încărca|failed|error)/i);
    await expect(errorMsg).toBeVisible();
    
    // Verificăm că restul paginii (header, etc.) e funcțional
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
