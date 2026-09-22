import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/store';

export const ShoppingListPage: React.FC = () => {
  const { t } = useTranslation();
  const { shoppingListItems } = useAppStore();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">{t('nav.shoppingList')}</h1>
      <p className="text-zinc-400 text-sm">
        Ingredientele lipsă adăugate pe lista de cumpărături ({shoppingListItems.length}).
      </p>
    </div>
  );
};

