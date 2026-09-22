import React from 'react';
import { useTranslation } from 'react-i18next';

export const HomePage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <h1 className="text-2xl font-bold text-zinc-100">{t('app.title')}</h1>
  );
};

