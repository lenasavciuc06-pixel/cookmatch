import React from 'react';
import { useTranslation } from 'react-i18next';

export const RecipesPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">{t('nav.recipes')}</h1>
      <p className="text-zinc-400 text-sm">
        Catalogul de rețete optimizate conform ingredientelor disponibile.
      </p>
    </div>
  );
};

