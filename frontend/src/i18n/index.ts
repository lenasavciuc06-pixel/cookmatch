import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { appLanguage } from './language';
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
import ruCommon from './locales/ru/common.json';
import ruHome from './locales/ru/home.json';
import ruIngredients from './locales/ru/ingredients.json';
import ruRecipes from './locales/ru/recipes.json';
import ruShopping from './locales/ru/shopping.json';

export const resources = {
  ro: { common: roCommon, home: roHome, recipes: roRecipes, ingredients: roIngredients, shopping: roShopping },
  en: { common: enCommon, home: enHome, recipes: enRecipes, ingredients: enIngredients, shopping: enShopping },
  ru: { common: ruCommon, home: ruHome, recipes: ruRecipes, ingredients: ruIngredients, shopping: ruShopping },
} as const;

export type AppLanguage = keyof typeof resources;

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'ro' || value === 'en' || value === 'ru';
}

function detectLanguage(): AppLanguage {
  const queryLanguage = new URLSearchParams(window.location.search).get('lang');
  if (isAppLanguage(queryLanguage)) {
    return queryLanguage;
  }

  try {
    const saved = localStorage.getItem('cookmatch-language');
    if (isAppLanguage(saved)) return saved;
  } catch { /* Language selection also works without storage. */ }
  return appLanguage(navigator.language);
}

export const initialLanguage = detectLanguage();

function applyLanguage(value: string) {
  const language = appLanguage(value);
  document.documentElement.lang = language;
  try { localStorage.setItem('cookmatch-language', language); } catch { /* Storage can be unavailable. */ }
  const url = new URL(window.location.href);
  if (url.searchParams.has('lang')) {
    url.searchParams.set('lang', language);
    window.history.replaceState(window.history.state, '', url);
  }
}
i18n.on('languageChanged', applyLanguage);

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
  supportedLngs: ['ro', 'en', 'ru'],
  defaultNS: 'common',
  ns: ['common', 'home', 'recipes', 'ingredients', 'shopping'],
  interpolation: { escapeValue: false },
});

export default i18n;

