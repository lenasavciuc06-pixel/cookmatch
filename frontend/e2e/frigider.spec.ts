import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Adăugare ingrediente și rezultate pe pagina principală', async ({ page }) => {
  for (const ingredient of ['cartofi', 'ouă', 'ceapă']) {
    await page.getByRole('combobox', { name: 'Adaugă ingrediente' }).fill(ingredient);
    await page.getByRole('combobox', { name: 'Adaugă ingrediente' }).press('Enter');
    await expect(page.getByRole('button', { name: `Șterge ingredientul ${ingredient}`, exact: true })).toBeVisible();
  }
  const response = page.waitForResponse(r => r.url().includes('/api/recipes/match') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Găsește ce pot găti', exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByRole('article').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Poți găti acum', exact: true })).toBeVisible();
});

test('Detaliile păstrează ingredientele selectate', async ({ page }) => {
  await page.getByRole('combobox').fill('cartofi');
  await page.getByRole('combobox').press('Enter');
  await page.getByRole('link', { name: 'Rețete', exact: true }).click();
  await page.getByRole('combobox').last().selectOption({ label: 'cartofi' });
  await expect(page.getByRole('article').first()).toBeVisible();
  await page.getByRole('article').first().getByRole('link').click();
  await expect(page.getByRole('heading', { name: 'Ingrediente', exact: true })).toBeVisible();
  await expect(page.getByText('cartofi', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('cartofi', { exact: true }).first().locator('..')).toHaveText(/✓/);
});

test('Ingredientele lipsă ajung în lista de cumpărături', async ({ page }) => {
  await page.goto('/recipes');
  await page.getByRole('article').first().getByRole('link').click();
  await page.getByRole('button', { name: 'Adaugă lipsurile la lista de cumpărături', exact: true }).click();
  await page.getByRole('link', { name: /^Listă cumpărături(?: \d+)?$/ }).click();
  await expect(page).toHaveURL(/\/shopping-list/);
  await expect(page.getByRole('listitem').first()).toBeVisible();
});

test('Adăugarea și eliminarea unei rețete favorite', async ({ page }) => {
  await page.goto('/recipes');
  await page.getByRole('article').first().getByRole('link').click();
  await page.getByRole('button', { name: 'Adaugă la favorite', exact: true }).click();
  await page.getByRole('link', { name: /^Favorite(?: \d+)?$/ }).click();
  const card = page.getByRole('article').first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: /elimină/i }).click();
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('Filtrarea după categorie modifică URL-ul și rezultatele', async ({ page }) => {
  await page.goto('/recipes');
  const response = page.waitForResponse(r => r.url().includes('/api/recipes?') && r.url().includes('category=Breakfast'));
  await page.getByRole('combobox').first().selectOption('Breakfast');
  await expect(page).toHaveURL(/category=Breakfast/);
  const data = await (await response).json();
  expect(data.items.length).toBeGreaterThan(0);
  expect(data.items.every((item: { category: string }) => item.category === 'Breakfast')).toBe(true);
  await expect(page.getByRole('article')).toHaveCount(data.items.length);
});

test('Comutarea limbii schimbă titlul și se poate inversa', async ({ page }) => {
  const heading = page.getByRole('heading', { level: 1 });
  const romanian = await heading.innerText();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(heading).toHaveText("What's in your fridge?");
  await page.getByRole('button', { name: 'RO', exact: true }).click();
  await expect(heading).toHaveText(romanian);
});

test('O eroare API afișează un mesaj și păstrează navigarea', async ({ page }) => {
  await page.route('**/api/recipes*', route => route.abort('failed'));
  await page.goto('/recipes');
  await expect(page.getByText('Catalogul nu a putut fi încărcat.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rețete', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Acasă', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Adaugă ingrediente' })).toBeVisible();
});



