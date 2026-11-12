import { expect, test } from '@playwright/test';

test('300 recipes are paginated and a recipe beyond the first 100 can be saved', async ({ page, request }) => {
  const response = await request.get('/api/recipes?page=1&pageSize=1&language=ro');
  expect(response.ok()).toBe(true);
  expect((await response.json()).totalCount).toBe(300);
  await page.goto('/recipes');
  await expect(page.getByRole('article')).toHaveCount(12);
  const initial = await page.getByRole('article').first().getByRole('heading').innerText();
  await page.getByRole('button', { name: 'Următorul', exact: true }).click();
  await expect(page).toHaveURL(/page=2(?:&|$)/);
  await expect(page.getByRole('article').first().getByRole('heading')).not.toHaveText(initial);
  await page.goto('/recipes?page=25');
  const card = page.getByRole('article').first();
  await expect(card).toBeVisible();
  const name = await card.getByRole('heading').innerText();
  await card.getByRole('button', { name: 'Adaugă la favorite', exact: true }).click();
  await page.getByRole('link', { name: /^Favorite(?: \d+)?$/ }).click();
  await expect(page.getByRole('article').getByRole('heading', { name, exact: true })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`Cooking stages show timing and visual guidance in both languages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/recipes/omleta-cu-ceapa-si-branza');
    const steps = page.locator('ol > li');
    await expect(steps).toHaveCount(4);
    await expect(steps.first()).toContainText('4 min');
    await expect(steps.first()).toContainText('Cum ar trebui să arate');
    await expect(steps.first()).toContainText('Ouăle sunt omogene');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) await page.getByRole('button', { name: 'Deschide meniul' }).click();
    await page.getByRole('button', { name: 'EN', exact: true }).filter({ visible: true }).click();
    if (width === 390) await page.keyboard.press('Escape');
    await expect(steps.first()).toContainText('What to look for');
    await expect(steps.first()).toContainText('Eggs are evenly mixed');
    await expect(steps.first()).toContainText('4 min');
  });
}
