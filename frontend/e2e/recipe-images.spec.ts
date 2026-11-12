import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const photos = JSON.parse(readFileSync(new URL('../src/assets/recipe-photos.json', import.meta.url), 'utf8')) as Record<string, {file: string | null}>;

test('every assigned local photograph is served successfully', async ({ request }) => {
  for (const photo of Object.values(photos)) {
    if (!photo.file) continue;
    const response = await request.get(photo.file);
    expect(response.ok(), photo.file).toBe(true);
    expect(response.headers()['content-type'], photo.file).toMatch(/^image\//);
  }
});

for (const width of [390, 1440]) {
  test(`cards and details use the same recipe-specific photograph at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width, height:900});
    await page.goto('/recipes?search=Omletă%20cu%20ceapă%20și%20brânză');
    const card = page.getByRole('article').first();
    await expect(card).toBeVisible();
    const image = card.locator('img');
    await expect(image).toHaveAttribute('src', '/images/recipes/omleta-cu-ceapa-si-branza.jpg');
    await image.evaluate((img: HTMLImageElement) => img.decode());
    const box = await image.boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(4 / 3, 2);
    await card.getByRole('link').click();
    const detailImage = page.locator('.details-photo img');
    await expect(detailImage).toHaveAttribute('src', '/images/recipes/omleta-cu-ceapa-si-branza.jpg');
    await detailImage.evaluate((img: HTMLImageElement) => img.decode());
    const detailBox = await detailImage.boundingBox();
    expect(detailBox!.width / detailBox!.height).toBeCloseTo(4 / 3, 2);
    expect(await detailImage.evaluate(img => getComputedStyle(img).objectFit)).toBe('cover');
    expect(await detailImage.evaluate(img => getComputedStyle(img).objectPosition)).toBe('50% 50%');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('failed image requests show an accessible empty state', async ({ page }) => {
  await page.route('**/images/recipes/tortilla-spanac-si-branza.jpg', route => route.abort());
  await page.goto('/recipes/tortilla-spanac-si-branza');
  await expect(page.locator('.details-photo').getByRole('img', {name:'Imagine indisponibilă'})).toBeVisible();
  await expect(page.locator('.details-photo img')).toHaveCount(0);
});
