import { describe, expect, it } from 'vitest';

import { appLanguage } from './language';
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enIngredients from './locales/en/ingredients.json';
import enRecipes from './locales/en/recipes.json';
import enShopping from './locales/en/shopping.json';
import ruCommon from './locales/ru/common.json';
import ruHome from './locales/ru/home.json';
import ruIngredients from './locales/ru/ingredients.json';
import ruRecipes from './locales/ru/recipes.json';
import ruShopping from './locales/ru/shopping.json';

function leaves(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => typeof item === 'string' ? [[prefix + key, item]] : Object.entries(leaves(item, prefix + key + '.'))));
}

describe('Russian localization', () => {
  it('supports regional language codes and a Romanian fallback', () => {
    expect(appLanguage('ru-RU')).toBe('ru');
    expect(appLanguage('EN-US')).toBe('en');
    expect(appLanguage('ro-MD')).toBe('ro');
    expect(appLanguage('fr')).toBe('ro');
  });
  it('covers every UI key and preserves interpolation variables', () => {
    for (const [en, ru] of [[enCommon, ruCommon], [enHome, ruHome], [enIngredients, ruIngredients], [enRecipes, ruRecipes], [enShopping, ruShopping]]) {
      const translated = leaves(ru);
      for (const [key, text] of Object.entries(leaves(en))) {
        expect(translated[key], key).toBeTruthy();
        expect(translated[key].match(/{{\w+}}/g), key).toEqual(text.match(/{{\w+}}/g));
      }
    }
  });
});
