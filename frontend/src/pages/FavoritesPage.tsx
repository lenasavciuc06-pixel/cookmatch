import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { getRecipeBySlug } from '@/api/client';
import type { RecipeSummary } from '@/api/types';
import { RecipeCard } from '@/features/recipes/RecipeCard';
import { appLanguage } from '@/i18n/language';
import { useAsync } from '@/lib/useAsync';
import { favoritesSelectors, useFavoritesStore } from '@/store';

export const FavoritesPage: React.FC = () => {
  const { t, i18n } = useTranslation('recipes');
  const favoriteSlugs = useFavoritesStore(favoritesSelectors.slugs);
  const toggleFavorite = useFavoritesStore(favoritesSelectors.toggle);
  const { data: loadedRecipes, isLoading, error, run: loadRecipes, reset: resetRecipes } = useAsync<RecipeSummary[]>([]);
  const [undoSlug, setUndoSlug] = useState<string | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const favoriteKey = Array.from(favoriteSlugs).sort().join('|');

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  useEffect(() => {
    if (favoriteSlugs.size === 0) {
      resetRecipes();
      return;
    }

    const language = appLanguage(i18n.language);
    void loadRecipes(async () => {
      return Promise.all(Array.from(favoriteSlugs, async (slug) => {
        const result = await getRecipeBySlug(slug, [], language);
        return result.recipe;
      }));
    });
  }, [favoriteKey, favoriteSlugs, i18n.language, loadRecipes, resetRecipes]);

  const visibleRecipes = useMemo(() => (loadedRecipes ?? []).filter((recipe) => favoriteSlugs.has(recipe.slug)), [favoriteSlugs, loadedRecipes]);

  const handleRemoved = (slug: string) => {
    setUndoSlug(slug);
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndoSlug(null), 5000);
  };

  const undo = () => {
    if (!undoSlug) return;
    toggleFavorite(undoSlug);
    setUndoSlug(null);
    window.clearTimeout(undoTimer.current);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text-primary">{t('favoritesTitle')}</h1>
        <p className="mt-2 text-sm text-text-muted">{t('favoritesDescription')}</p>
      </header>
      {undoSlug && <div role="status" className="flex items-center justify-between gap-4 rounded-lg border border-accent/30 bg-sage/40 px-4 py-3 text-sm text-accent"><span>{t('favoriteRemoved')}</span><button type="button" onClick={undo} className="font-semibold underline hover:text-accent">{t('undo')}</button></div>}
      {isLoading && <div className="h-64 animate-pulse rounded-lg border border-border bg-surface/60" />}
      {!isLoading && error && <p className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-6 text-center text-status-danger">{t('favoritesLoadError')}</p>}
      {!isLoading && !error && visibleRecipes.length === 0 && (
        <div className="rounded-lg border border-border bg-surface/50 p-8 text-center">
          <h2 className="font-semibold text-text-primary">{t('favoritesEmptyTitle')}</h2>
          <p className="mt-2 text-sm text-text-muted">{t('favoritesEmptyDescription')}</p>
          <Link to="/recipes" className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent">{t('browseRecipes')}</Link>
        </div>
      )}
      {!isLoading && !error && visibleRecipes.length > 0 && <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleRecipes.map((recipe) => <RecipeCard key={recipe.slug} recipe={recipe} onFavoriteRemoved={handleRemoved} />)}</div>}
    </div>
  );
};

