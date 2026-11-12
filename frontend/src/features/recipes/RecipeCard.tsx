import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { Difficulty, RecipeCategory, RecipeMatch, RecipeSummary } from '@/api/types';
import { RecipeImage } from '@/components/RecipeImage';
import { favoritesSelectors, useFavoritesStore } from '@/store';

export interface RecipeCardProps {
  recipe: RecipeSummary;
  match?: Pick<RecipeMatch, 'matchStatus' | 'matchedIngredients' | 'missingIngredients'>;
  showMissingIngredients?: boolean;
  onAddMissing?: (ingredients: string[]) => void;
  onFavoriteRemoved?: (slug: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe, match, showMissingIngredients = false, onAddMissing, onFavoriteRemoved,
}) => {
  const { t } = useTranslation('recipes');
  const isFavorite = useFavoritesStore((state) => state.slugs.has(recipe.slug));
  const toggleFavorite = useFavoritesStore(favoritesSelectors.toggle);
  const [addedMissing, setAddedMissing] = useState(false);
  const missingIngredients = match?.missingIngredients ?? [];

  return (
    <article className="recipe-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-sage">
        <RecipeImage src={recipe.imageUrl} slug={recipe.slug} alt={recipe.name} className="recipe-image" />
        <button type="button" onClick={() => { toggleFavorite(recipe.slug); if (isFavorite) onFavoriteRemoved?.(recipe.slug); }} aria-pressed={isFavorite} aria-label={isFavorite ? t('removeFavorite') : t('addFavorite')} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface/95 text-2xl text-accent shadow-sm transition-colors hover:bg-sage">
          <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
        </button>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">{t(`categories.${recipe.category}` as `categories.${RecipeCategory}`)}</p>
        <h3 className="break-words text-text-primary">{recipe.name}</h3>
        <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-text-secondary">{recipe.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
          <span><span aria-hidden="true" className="mr-1">◷</span>{t('prepTime', { count: recipe.prepTimeMinutes })}</span>
          <span>{t(`difficulty.${recipe.difficulty}` as `difficulty.${Difficulty}`)}</span>
        </div>
        {match && <p className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${missingIngredients.length === 0 ? 'bg-status-success/10 text-status-success' : 'bg-status-warning/10 text-status-warning'}`}><span aria-hidden="true">{missingIngredients.length === 0 ? '✓' : '!'} </span>{t(`matchStatus.${match.matchStatus}` as const)}</p>}
        {showMissingIngredients && missingIngredients.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-status-warning">{t('missingIngredients')}</p>
            <p className="mt-1 break-words text-sm leading-6 text-text-secondary">{missingIngredients.join(', ')}</p>
            {onAddMissing && <button type="button" onClick={() => { onAddMissing(missingIngredients); setAddedMissing(true); }} className="mt-3 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-accent hover:bg-sage">{addedMissing ? t('addedToShopping') : t('addMissingToShopping')}</button>}
          </div>
        )}
        <div className="mt-auto pt-5">
          <Link to={`/recipes/${recipe.slug}`} className="inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-accent underline decoration-border underline-offset-4 hover:decoration-accent">
            {t('viewRecipe')} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
