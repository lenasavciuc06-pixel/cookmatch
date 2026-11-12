import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const corrections = JSON.parse(readFileSync(new URL('../../docs/recipe-images/corrections.json', import.meta.url), 'utf8')) as Array<{
  slug: string; reteta: string; matchedName: string; file: string; sha256: string; width: number; height: number;
}>;

test('all 34 corrected local images retain their original bytes', async ({ request }) => {
  expect(corrections).toHaveLength(34);
  for (const photo of corrections) {
    const response = await request.get(photo.file);
    expect(response.ok(), photo.reteta).toBe(true);
    expect(createHash('sha256').update(await response.body()).digest('hex'), photo.reteta).toBe(photo.sha256);
  }
});

for (const width of [390, 1440]) {
  test(`all 34 corrections display in cards and details at ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    for (const photo of corrections) {
      await page.goto(`/recipes?search=${encodeURIComponent(photo.matchedName)}`);
      const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: photo.matchedName, exact: true }) });
      const image = card.locator('img');
      await expect(image, photo.reteta).toHaveAttribute('src', photo.file);
      await image.evaluate((img: HTMLImageElement) => img.decode());
      const cardBox = await image.boundingBox();
      expect(cardBox!.width / cardBox!.height, photo.reteta).toBeCloseTo(4 / 3, 2);
      await card.getByRole('link').click();
      const detail = page.locator('.details-photo img');
      await expect(detail).toHaveAttribute('src', photo.file);
      await detail.evaluate((img: HTMLImageElement) => img.decode());
      expect(await detail.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])).toEqual([photo.width, photo.height]);
      const box = await detail.boundingBox();
      expect(box!.width / box!.height).toBeCloseTo(4 / 3, 2);
      expect(await detail.evaluate(img => [getComputedStyle(img).objectFit, getComputedStyle(img).objectPosition])).toEqual(['cover', '50% 50%']);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (photo.slug === 'salata-greceasca') {
        await page.screenshot({ path: `../artifacts/image-corrections/detail-${width}.png`, fullPage: true });
      }
    }
  });
}
