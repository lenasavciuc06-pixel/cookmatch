import React from 'react';
import { useTranslation } from 'react-i18next';

import { shoppingListSelectors, useShoppingListStore } from '@/store';

export const ShoppingListPage: React.FC = () => {
  const { t } = useTranslation('common');
  const shoppingListItems = useShoppingListStore(shoppingListSelectors.items);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">{t('nav.shoppingList')}</h1>
      <p className="text-zinc-400 text-sm">{t('description', { ns: 'shopping', count: shoppingListItems.length })}</p>
    </div>
  );
};

