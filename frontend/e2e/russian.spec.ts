import { expect, test } from '@playwright/test';

test('Russian catalog supports Cyrillic search, details and matching', async ({ page, request }) => {
  await page.setViewportSize({width:1440,height:900});
  const catalog = await request.get('/api/recipes?language=ru&pageSize=100');
  expect(catalog.ok()).toBe(true);
  expect((await catalog.json()).totalCount).toBe(300);
  await page.goto('/recipes?lang=ru&search=' + encodeURIComponent('ОМЛЕТ С ЛУКОМ И СЫРОМ'));
  const card = page.getByRole('article');
  await expect(card.getByRole('heading', { name: 'Омлет с луком и сыром', exact: true })).toBeVisible();
  await card.getByRole('button', {name:'В избранное'}).click();
  await card.getByRole('link').click();
  await expect(page.getByRole('heading', {name:'Омлет с луком и сыром',exact:true})).toBeVisible();
  await expect(page.getByText('Как должно выглядеть', {exact:true})).toHaveCount(4);
  await expect(page.getByText('4 мин', {exact:true})).toHaveCount(2);
  await expect(page.locator('.details-photo img')).toHaveJSProperty('complete',true);
  await page.getByRole('button', {name:'Добавить недостающее в список покупок'}).click();
  await page.getByRole('link', {name:/^Список покупок/}).click();
  await expect(page.getByRole('heading', {name:'Список покупок'})).toBeVisible();
  await expect(page.getByText('яйца', {exact:true})).toBeVisible();
  await page.getByRole('link', {name:/^Избранное/}).click();
  await expect(page.getByRole('article').getByRole('heading', {name:'Омлет с луком и сыром'})).toBeVisible();
  await page.getByRole('link', {name:'Главная',exact:true}).click();
  const input = page.getByRole('combobox');
  await input.fill('карто');
  await expect(page.getByRole('option', {name:'картофель',exact:true})).toBeVisible();
  await input.press('ArrowDown');
  await input.press('Enter');
  await page.getByRole('button', {name:'Что я могу приготовить?',exact:true}).click();
  await expect(page.getByRole('article').first()).toBeVisible();
  expect(await page.getByRole('article').first().getByRole('heading').innerText()).toMatch(/[А-Яа-я]/);
  await page.getByRole('button',{name:'EN',exact:true}).click();
  await expect(page.getByRole('article').first().getByRole('heading')).toHaveText(/[A-Za-z]/);
  await page.getByRole('button',{name:'Remove ingredient картофель',exact:true}).click();
  await expect(page.getByRole('button',{name:'Find what I can cook',exact:true})).toBeDisabled();
  await expect(page.getByRole('article')).toHaveCount(0);
});

for (const width of [390,1440]) {
  test(`Russian language persists and fits the layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width,height:900});
    await page.goto('/?lang=ru');
    await expect(page.getByRole('heading', {name:'Что есть в холодильнике?'})).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang','ru');
    if(width === 390) await page.getByRole('button',{name:'Открыть меню'}).click();
    await expect(page.getByRole('button',{name:'RU',exact:true})).toHaveAttribute('aria-pressed','true');
    if(width === 390) await page.keyboard.press('Escape');
    await page.goto('/recipes');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang','ru');
    await expect(page.getByRole('article').first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('article').locator('img').evaluateAll(images => Promise.all(images.map(image => {
      image.loading = 'eager';
      return image.decode();
    })));
    await page.screenshot({path:`../artifacts/russian/catalog-${width}.png`});
    if(width === 390) await page.getByRole('button',{name:'Открыть меню'}).click();
    await page.getByRole('button',{name:'EN',exact:true}).click();
    if(width === 390) await page.keyboard.press('Escape');
    await expect(page.getByRole('heading',{name:'Recipes',exact:true})).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang','en');
    if(width === 390) await page.getByRole('button',{name:'Open menu'}).click();
    await page.getByRole('button',{name:'RO',exact:true}).click();
    if(width === 390) await page.keyboard.press('Escape');
    await expect(page.getByRole('heading',{name:'Rețete',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
