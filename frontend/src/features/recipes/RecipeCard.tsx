import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { Difficulty, RecipeMatch, RecipeSummary } from '@/api/types';
import { favoritesSelectors, useFavoritesStore } from '@/store';

export interface RecipeCardProps {
  recipe: RecipeSummary;
  match?: Pick<RecipeMatch, 'matchStatus' | 'matchedIngredients' | 'missingIngredients'>;
  showMissingIngredients?: boolean;
  onAddMissing?: (ingredients: string[]) => void;
  onFavoriteRemoved?: (slug: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  match,
  showMissingIngredients = false,
  onAddMissing,
  onFavoriteRemoved,
}) => {
  const { t } = useTranslation('recipes');
  const isFavorite = useFavoritesStore((state) => state.slugs.has(recipe.slug));
  const toggleFavorite = useFavoritesStore(favoritesSelectors.toggle);
  const [imageFailed, setImageFailed] = useState(false);
  const missingIngredients = match?.missingIngredients ?? [];
  const ingredientCount = (match?.matchedIngredients.length ?? 0) + missingIngredients.length;

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-lg shadow-black/10">
      <div className="relative aspect-[16/9] bg-zinc-800">
        {!imageFailed && recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} width={1200} height={675} loading="lazy" decoding="async" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-zinc-600" aria-label={t('imageUnavailable')}>🥣</div>
        )}
        <button type="button" onClick={() => { toggleFavorite(recipe.slug); if (isFavorite) onFavoriteRemoved?.(recipe.slug); }} aria-pressed={isFavorite} aria-label={isFavorite ? t('removeFavorite') : t('addFavorite')} className="absolute right-3 top-3 rounded-full bg-zinc-950/75 px-3 py-2 text-lg text-white backdrop-blur hover:bg-emerald-700">
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>
      <div className="p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="min-w-0 break-words font-semibold text-zinc-100">{recipe.name}</h3>
            <p className="mt-1 line-clamp-2 break-words text-sm text-zinc-300">{recipe.description}</p>
          </div>
          <span className="max-w-[45%] shrink-0 break-words rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{recipe.category}</span>
        </div>
        {match && <p className="mt-3 text-xs font-semibold text-emerald-300">{t(`matchStatus.${match.matchStatus}` as const)}</p>}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
          <span>{t('prepTime', { count: recipe.prepTimeMinutes })}</span>
          <span>{t(`difficulty.${recipe.difficulty}` as `difficulty.${Difficulty}`)}</span>
          <span>{t('ingredientsCount', { count: ingredientCount })}</span>
        </div>
        {showMissingIngredients && missingIngredients.length > 0 && (
          <div className="mt-4 border-t border-zinc-800 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">{t('missingIngredients')}</p>
            <p className="mt-1 text-sm text-amber-200">{missingIngredients.join(', ')}</p>
            {onAddMissing && (
              <button type="button" onClick={() => onAddMissing(missingIngredients)} className="mt-3 rounded-md border border-amber-700 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-950/60">
                {t('addMissingToShopping')}
              </button>
            )}
          </div>
        )}
        <Link to={`/recipes/${recipe.slug}`} className="mt-4 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">
          {t('viewRecipe')}
        </Link>
      </div>
    </article>
  );
};

export const MemoizedRecipeCard = React.memo(RecipeCard);