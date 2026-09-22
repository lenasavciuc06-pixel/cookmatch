import React from 'react';
import { useTranslation } from 'react-i18next';

export const RecipesPage: React.FC = () => {
  const { t } = useTranslation('recipes');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">{t('title')}</h1>
      <p className="text-zinc-400 text-sm">
        {t('description')}
      </p>
    </div>
  );
};

