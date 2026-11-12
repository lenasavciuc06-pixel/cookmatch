import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation('common');
  const currentLanguage = i18n.language.startsWith('en') ? 'en' : 'ro';

  return (
    <div className="language-switcher ml-2 flex items-center gap-1 rounded-md border border-border bg-surface-elevated p-1" aria-label={t('common.language')}>
      <button type="button" onClick={() => void i18n.changeLanguage('ro')} aria-pressed={currentLanguage === 'ro'} className={`rounded px-3 py-2 text-xs font-semibold transition ${currentLanguage === 'ro' ? 'bg-accent text-on-accent' : 'text-text-muted hover:text-accent'}`}>
        RO
      </button>
      <button type="button" onClick={() => void i18n.changeLanguage('en')} aria-pressed={currentLanguage === 'en'} className={`rounded px-3 py-2 text-xs font-semibold transition ${currentLanguage === 'en' ? 'bg-accent text-on-accent' : 'text-text-muted hover:text-accent'}`}>
        EN
      </button>
    </div>
  );
};