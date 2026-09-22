import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ro from './locales/ro.json';

export const defaultNS = 'translation';
export const resources = {
  ro: { translation: ro },
  en: { translation: en },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'ro',
  fallbackLng: 'ro',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

