import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { getCategories, getIngredients, getRecipes, matchRecipes } from '@/api/client';
import type { Category, Difficulty, Ingredient, RecipeCategory, RecipeMatch, RecipeSummary } from '@/api/types';
import { RecipeCard } from '@/features/recipes/RecipeCard';
import { ingredientsSelectors, useIngredientsStore } from '@/store';

export const RecipesPage: React.FC = () => {
  const { t, i18n } = useTranslation('recipes');
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIngredients = useIngredientsStore(ingredientsSelectors.items);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [matches, setMatches] = useState<Map<string, RecipeMatch>>(new Map());
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const language = i18n.language.startsWith('en') ? 'en' : 'ro';
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const pageSize = Number(searchParams.get('pageSize') ?? '12') || 12;
  const category = searchParams.get('category') ?? '';
  const maxTime = searchParams.get('maxTime') ?? '';
  const difficulty = searchParams.get('difficulty') ?? '';
  const ingredient = searchParams.get('ingredient') ?? '';

  useEffect(() => {
    setSearchInput(searchParams.get('search') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentSearch = searchParams.get('search') ?? '';
      if (searchInput === currentSearch) {
        return;
      }

      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) next.set('search', searchInput.trim());
      else next.delete('search');
      next.set('page', '1');
      setSearchParams(next);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput, searchParams, setSearchParams]);

  useEffect(() => {
    void Promise.all([getCategories(), getIngredients()])
      .then(([loadedCategories, loadedIngredients]) => {
        setCategories(loadedCategories);
        setIngredients(loadedIngredients);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(false);

    void getRecipes({
      search: searchParams.get('search') ?? undefined,
      category: category as RecipeCategory | undefined,
      maxTime: maxTime ? Number(maxTime) : undefined,
      difficulty: difficulty as Difficulty | undefined,
      ingredient: ingredient || undefined,
      language,
      page,
      pageSize,
    })
      .then(async (result) => {
        if (cancelled) return;
        setRecipes(result.items);
        setTotalCount(result.totalCount);
        if (sessionIngredients.length > 0 && result.items.length > 0) {
          const matched = await matchRecipes({ ingredients: sessionIngredients, language });
          if (!cancelled) setMatches(new Map(matched.map((item) => [item.recipe.slug, item])));
        } else {
          setMatches(new Map());
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, difficulty, ingredient, language, maxTime, page, pageSize, searchParams, sessionIngredients]);

  const activeFilters = useMemo(() => {
    const labels: Array<{ key: string; label: string }> = [];
    if (searchParams.get('search')) labels.push({ key: 'search', label: `${t('filterSearch')}: ${searchParams.get('search')}` });
    if (category) {
      const selectedCategory = categories.find((item) => item.value === category);
      labels.push({ key: 'category', label: language === 'en' ? selectedCategory?.labelEn ?? category : selectedCategory?.labelRo ?? category });
    }
    if (maxTime) labels.push({ key: 'maxTime', label: `${t('maxTime')}: ${t('minutes', { count: Number(maxTime) })}` });
    if (difficulty) labels.push({ key: 'difficulty', label: t(`difficulty.${difficulty}` as `difficulty.${Difficulty}`) });
    if (ingredient) labels.push({ key: 'ingredient', label: `${t('filterIngredient')}: ${ingredient}` });
    return labels;
  }, [categories, category, difficulty, ingredient, language, maxTime, searchParams, t]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const resetFilters = () => setSearchParams({ page: '1', pageSize: String(pageSize) });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{t('title')}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t('description')}</p>
        </div>
        <button type="button" onClick={() => setIsFilterPanelOpen(true)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 md:hidden">{t('openFilters')}</button>
      </div>

      <div className={`fixed inset-0 z-50 bg-black/60 md:static md:bg-transparent ${isFilterPanelOpen ? 'block' : 'hidden md:block'}`} onClick={() => setIsFilterPanelOpen(false)}>
        <div className="ml-auto h-full w-80 max-w-[90vw] overflow-y-auto bg-zinc-950 p-5 md:w-auto md:max-w-none md:bg-transparent md:p-0" onClick={(event) => event.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between md:hidden"><h2 className="font-semibold text-zinc-100">{t('filters')}</h2><button type="button" onClick={() => setIsFilterPanelOpen(false)} aria-label={t('closeFilters')}>×</button></div>
          <div className="grid min-w-0 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:grid-cols-5">
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t('searchPlaceholder')} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500" />
            <select value={category} onChange={(event) => updateFilter('category', event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"><option value="">{t('allCategories')}</option>{categories.map((item) => <option key={item.value} value={item.value}>{language === 'en' ? item.labelEn : item.labelRo}</option>)}</select>
            <select value={maxTime} onChange={(event) => updateFilter('maxTime', event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"><option value="">{t('anyTime')}</option>{[15, 30, 45, 60].map((time) => <option key={time} value={time}>{t('minutes', { count: time })}</option>)}</select>
            <select value={difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"><option value="">{t('anyDifficulty')}</option>{(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => <option key={level} value={level}>{t(`difficulty.${level}` as `difficulty.${Difficulty}`)}</option>)}</select>
            <select value={ingredient} onChange={(event) => updateFilter('ingredient', event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"><option value="">{t('anyIngredient')}</option>{ingredients.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select>
          </div>
        </div>
      </div>

      {activeFilters.length > 0 && <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-zinc-500">{t('activeFilters')}</span>{activeFilters.map((filter) => <button key={filter.key} type="button" onClick={() => updateFilter(filter.key, '')} className="rounded-full bg-emerald-950 px-3 py-1 text-xs text-emerald-300">{filter.label} ×</button>)}<button type="button" onClick={resetFilters} className="text-xs text-zinc-400 underline hover:text-white">{t('resetFilters')}</button></div>}

      {isLoading && <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-80 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />)}</div>}
      {!isLoading && error && <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-8 text-center text-red-200">{t('loadError')}</div>}
      {!isLoading && !error && recipes.length === 0 && <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center"><h2 className="font-semibold text-zinc-100">{t('emptyTitle')}</h2><p className="mt-2 text-sm text-zinc-400">{t('emptyDescription')}</p></div>}
      {!isLoading && !error && recipes.length > 0 && <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{recipes.map((recipe) => <RecipeCard key={recipe.slug} recipe={recipe} match={matches.get(recipe.slug)} showMissingIngredients={matches.has(recipe.slug)} />)}</div>}
      {!isLoading && !error && recipes.length > 0 && <div className="flex items-center justify-center gap-4"><button type="button" disabled={page <= 1} onClick={() => updateFilter('page', String(page - 1))} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm disabled:opacity-40">{t('previous')}</button><span className="text-sm text-zinc-400">{page} / {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => updateFilter('page', String(page + 1))} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm disabled:opacity-40">{t('next')}</button></div>}
    </div>
  );

  return <h1 className="text-2xl font-bold text-zinc-100">{t('title')}</h1>;
};

