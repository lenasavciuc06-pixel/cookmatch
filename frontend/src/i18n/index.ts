import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enIngredients from './locales/en/ingredients.json';
import enRecipes from './locales/en/recipes.json';
import enShopping from './locales/en/shopping.json';
import roCommon from './locales/ro/common.json';
import roHome from './locales/ro/home.json';
import roIngredients from './locales/ro/ingredients.json';
import roRecipes from './locales/ro/recipes.json';
import roShopping from './locales/ro/shopping.json';

export const resources = {
  ro: { common: roCommon, home: roHome, recipes: roRecipes, ingredients: roIngredients, shopping: roShopping },
  en: { common: enCommon, home: enHome, recipes: enRecipes, ingredients: enIngredients, shopping: enShopping },
} as const;

export type AppLanguage = keyof typeof resources;

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'ro' || value === 'en';
}

function detectLanguage(): AppLanguage {
  const queryLanguage = new URLSearchParams(window.location.search).get('lang');
  if (isAppLanguage(queryLanguage)) {
    return queryLanguage;
  }

  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'ro';
}

export const initialLanguage = detectLanguage();

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['ro'];
  }
}

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'ro',
  defaultNS: 'common',
  ns: ['common', 'home', 'recipes', 'ingredients', 'shopping'],
  interpolation: { escapeValue: false },
});

export default i18n;

