import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`Ingredient flow, theme and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const input = page.getByRole('combobox', { name: 'Adaugă ingrediente' });
    await input.fill('cartofi');
    await input.press('Enter');
    await page.getByRole('button', { name: 'Găsește ce pot găti', exact: true }).click();
    await expect(page.getByRole('article').first()).toBeVisible();
    await expect(page.getByRole('article').first().locator('img')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('0 ingrediente');
    const assertFits = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    };
    await assertFits();
    if (width === 390) {
      await page.getByRole('button', { name: 'Deschide meniul' }).click();
      await expect(page.locator('aside nav a').first()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Deschide meniul' })).toBeFocused();
      await page.getByRole('button', { name: 'Deschide meniul' }).click();
    }
    await page.getByRole('button', { name: 'Schimbă tema' }).filter({ visible: true }).click();
    await expect(page.locator('html')).toHaveClass('dark');
    if (width === 390) await page.keyboard.press('Escape');
    await page.getByRole('article').first().getByRole('link').click();
    await expect(page.getByRole('heading', { name: 'Ingrediente', exact: true })).toBeVisible();
    await assertFits();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass('dark');
  });
}

test('Recipe photography has an accessible fallback', async ({ page }) => {
  await page.route('**/images/recipes/**', (route) => route.abort());
  await page.goto('/recipes', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('article').first().getByRole('img', { name: 'Imagine indisponibilă' })).toBeVisible();
});
