import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { getRecipes } from '@/api/client';
import type { RecipeSummary } from '@/api/types';
import { RecipeCard } from '@/features/recipes/RecipeCard';
import { favoritesSelectors, useFavoritesStore } from '@/store';

export const FavoritesPage: React.FC = () => {
  const { t, i18n } = useTranslation('recipes');
  const favoriteSlugs = useFavoritesStore(favoritesSelectors.slugs);
  const toggleFavorite = useFavoritesStore(favoritesSelectors.toggle);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [undoSlug, setUndoSlug] = useState<string | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const favoriteKey = Array.from(favoriteSlugs).sort().join('|');

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  useEffect(() => {
    if (favoriteSlugs.size === 0) {
      setRecipes([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setHasError(false);
    const language = i18n.language.startsWith('en') ? 'en' : 'ro';
    void getRecipes({ language, page: 1, pageSize: 100 })
      .then((result) => {
        if (!cancelled) setRecipes(result.items.filter((recipe) => favoriteSlugs.has(recipe.slug)));
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [favoriteKey, favoriteSlugs, i18n.language]);

  const visibleRecipes = useMemo(() => recipes.filter((recipe) => favoriteSlugs.has(recipe.slug)), [favoriteSlugs, recipes]);

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
        <h1 className="text-2xl font-semibold text-zinc-100">{t('favoritesTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-400">{t('favoritesDescription')}</p>
      </header>
      {undoSlug && <div role="status" className="flex items-center justify-between gap-4 rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"><span>{t('favoriteRemoved')}</span><button type="button" onClick={undo} className="font-semibold underline hover:text-white">{t('undo')}</button></div>}
      {isLoading && <div className="h-64 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/60" />}
      {!isLoading && hasError && <p className="rounded-lg border border-red-900/60 bg-red-950/20 p-6 text-center text-red-200">{t('favoritesLoadError')}</p>}
      {!isLoading && !hasError && visibleRecipes.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <h2 className="font-semibold text-zinc-100">{t('favoritesEmptyTitle')}</h2>
          <p className="mt-2 text-sm text-zinc-400">{t('favoritesEmptyDescription')}</p>
          <Link to="/recipes" className="mt-5 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">{t('browseRecipes')}</Link>
        </div>
      )}
      {!isLoading && !hasError && visibleRecipes.length > 0 && <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleRecipes.map((recipe) => <RecipeCard key={recipe.slug} recipe={recipe} onFavoriteRemoved={handleRemoved} />)}</div>}
    </div>
  );
};

