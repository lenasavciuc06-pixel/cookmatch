import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { getRecipeBySlug } from '@/api/client';
import type { Difficulty, Recipe, RecipeCategory } from '@/api/types';
import { useAsync } from '@/lib/useAsync';
import { favoritesSelectors, ingredientsSelectors, shoppingListSelectors, useFavoritesStore, useIngredientsStore, useShoppingListStore } from '@/store';

export const RecipeDetailsPage: React.FC = () => {
  const { t, i18n } = useTranslation('recipes');
  const { t: commonT } = useTranslation('common');
  const { slug } = useParams<{ slug: string }>();
  const sessionIngredients = useIngredientsStore(ingredientsSelectors.items);
  const toggleFavorite = useFavoritesStore(favoritesSelectors.toggle);
  const favoriteSlugs = useFavoritesStore(favoritesSelectors.slugs);
  const addManyToShoppingList = useShoppingListStore(shoppingListSelectors.addMany);
  const { data: recipe, error, isLoading, run: loadRecipe } = useAsync<Recipe>();

  const isFavorite = slug ? favoriteSlugs.has(slug) : false;
  const language = i18n.language.startsWith('en') ? 'en' : 'ro';
  const missingIngredients = useMemo(
    () => recipe?.ingredients.filter((ingredient) => !ingredient.isAvailable && !ingredient.isPantryStaple) ?? [],
    [recipe],
  );

  useEffect(() => {
    if (!slug) {
      return;
    }

    void loadRecipe(() => getRecipeBySlug(slug, sessionIngredients, language));
  }, [language, loadRecipe, sessionIngredients, slug]);

  useEffect(() => {
    if (!recipe) return;

    document.title = `${recipe.recipe.name} | Frigider`;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.append(description);
    }
    description.content = recipe.recipe.description;
  }, [recipe]);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg border border-border bg-surface" aria-label={commonT('common.loading')} />;
  }

  if (error?.statusCode === 404 || (!slug && !isLoading)) {
    return <EmptyRecipeState title={t('recipeNotFound')} description={t('recipeNotFoundDescription')} />;
  }

  if (error || !recipe) {
    return <EmptyRecipeState title={t('loadError')} description={t('recipeLoadErrorDescription')} />;
  }

  const { recipe: summary, ingredients, instructions } = recipe;

  return (
    <article className="space-y-10">
      <header className="relative overflow-hidden rounded-lg border border-border bg-surface">
        <img src={summary.imageUrl} alt={summary.name} width={1200} height={675} decoding="async" className="h-64 w-full object-cover sm:h-80" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pt-20 sm:p-8 sm:pt-24">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">{t(`categories.${summary.category}` as `categories.${RecipeCategory}`)}</p>
              <h1 className="break-words text-2xl font-semibold text-white sm:text-4xl">{summary.name}</h1>
              <p className="mt-2 max-w-3xl break-words text-base text-zinc-200">{summary.description}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleFavorite(summary.slug)}
              className="shrink-0 rounded-full border border-white/30 bg-black/40 px-4 py-3 text-sm text-white backdrop-blur hover:border-accent hover:text-accent"
              aria-label={t(isFavorite ? 'removeFavorite' : 'addFavorite')}
              aria-pressed={isFavorite}
            >
              <span aria-hidden="true" className="text-xl">{isFavorite ? '★' : '☆'}</span>
              <span className="sr-only">{t(isFavorite ? 'removeFavorite' : 'addFavorite')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        <MetaItem label={t('prepTimeLabel')} value={t('prepTime', { count: summary.prepTimeMinutes })} />
        <MetaItem label={t('difficultyLabel')} value={t(`difficulty.${summary.difficulty}` as `difficulty.${Difficulty}`)} />
        <MetaItem label={t('servingsLabel')} value={t('servings', { count: summary.servings })} />
        <MetaItem label={t('categoryLabel')} value={t(`categories.${summary.category}` as `categories.${RecipeCategory}`)} />
      </div>

      <section aria-labelledby="ingredients-heading" className="space-y-5">
        <div>
          <h2 id="ingredients-heading" className="text-xl font-semibold text-text-primary">{t('ingredientsTitle')}</h2>
          {sessionIngredients.length === 0 && <p className="mt-2 text-sm text-text-muted">{t('addIngredientsHint')}</p>}
        </div>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {ingredients.map((ingredient) => (
            <li key={ingredient.name} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
              <span className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${ingredient.isPantryStaple ? 'bg-surface-elevated text-text-muted' : ingredient.isAvailable ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning'}`} aria-hidden="true">
                  {ingredient.isPantryStaple ? '·' : ingredient.isAvailable ? '✓' : '!'}
                </span>
                <span className={`min-w-0 break-words ${ingredient.isPantryStaple ? 'text-text-muted' : ingredient.isAvailable ? 'text-status-success' : 'text-status-warning'}`}>{ingredient.name}</span>
                {ingredient.isPantryStaple && <span className="text-xs text-text-muted">{t('alwaysAvailable')}</span>}
              </span>
              <span className="text-right text-sm text-text-secondary">{ingredient.quantity}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-lg border border-border bg-surface-elevated p-5">
          {missingIngredients.length > 0 ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-text-secondary">{t('missingSummary', { ingredients: missingIngredients.map((ingredient) => ingredient.name).join(', ') })}</p>
              <button type="button" onClick={() => addManyToShoppingList(missingIngredients.map((ingredient) => ingredient.name), summary.name)} className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface hover:bg-accent-hover">
                {t('addMissingToShopping')}
              </button>
            </div>
          ) : <p className="font-semibold text-status-success">{t('everythingAvailable')}</p>}
        </div>
      </section>

      <section aria-labelledby="instructions-heading" className="space-y-5">
        <h2 id="instructions-heading" className="text-xl font-semibold text-text-primary">{t('instructionsTitle')}</h2>
        <ol className="space-y-7">
          {instructions.map((instruction, index) => (
            <li key={`${index}-${instruction}`} className="flex gap-4 text-lg leading-8 text-text-secondary sm:text-xl">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-surface">{index + 1}</span>
              <p>{instruction}</p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
};

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-surface px-4 py-4 sm:px-5">
    <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
    <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
  </div>
);

const EmptyRecipeState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <EmptyRecipeContent title={title} description={description} />
);

const EmptyRecipeContent: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  const { t } = useTranslation('recipes');

  return (
    <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
      <p className="text-text-secondary">{description}</p>
      <Link to="/recipes" className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface hover:bg-accent-hover">
        {t('backToRecipes')}
      </Link>
    </div>
  );
};