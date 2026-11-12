import React from 'react';
import { useTranslation } from 'react-i18next';

import { appLanguage } from '@/i18n/language';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation('common');
  const currentLanguage = appLanguage(i18n.language);

  return (
    <div className="language-switcher ml-2 flex items-center gap-1 rounded-md border border-border bg-surface-elevated p-1" aria-label={t('common.language')}>
      {(['ro', 'en', 'ru'] as const).map(language => <button key={language} type="button" lang={language} title={{ro:'Română',en:'English',ru:'Русский'}[language]} onClick={() => void i18n.changeLanguage(language)} aria-pressed={currentLanguage === language} className={`rounded px-3 py-2 text-xs font-semibold transition ${currentLanguage === language ? 'bg-accent text-on-accent' : 'text-text-muted hover:text-accent'}`}>
        {language.toUpperCase()}
      </button>)}
    </div>
  );
};
