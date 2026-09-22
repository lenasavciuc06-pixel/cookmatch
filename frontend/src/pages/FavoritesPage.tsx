import React from 'react';
import { useTranslation } from 'react-i18next';

import { favoritesSelectors, useFavoritesStore } from '@/store';

export const FavoritesPage: React.FC = () => {
  const { t } = useTranslation('common');
  const favoriteRecipeCount = useFavoritesStore(favoritesSelectors.slugs).size;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">{t('nav.favorites')}</h1>
      <p className="text-zinc-400 text-sm">{t('favoritesCount', { ns: 'recipes', count: favoriteRecipeCount })}</p>
    </div>
  );
};

