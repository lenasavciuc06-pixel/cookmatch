import React from 'react';
import { useTranslation } from 'react-i18next';

export const MyIngredientsPage: React.FC = () => {
  const { t } = useTranslation('ingredients');
  return <h1 className="text-2xl font-bold text-zinc-100">{t('title')}</h1>;
};