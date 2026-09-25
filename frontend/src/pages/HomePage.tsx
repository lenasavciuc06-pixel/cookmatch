import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { matchRecipes } from '@/api/client';
import type { RecipeMatch } from '@/api/types';
import { IngredientInput } from '@/features/ingredients';
import { MatchResults } from '@/features/recipes';
import { ingredientsSelectors, useIngredientsStore } from '@/store';

export interface HomeNavigationState {
  preloadedResults?: RecipeMatch[];
}

export const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'home']);
  const location = useLocation();
  const ingredients = useIngredientsStore(ingredientsSelectors.items);
  const addIngredient = useIngredientsStore(ingredientsSelectors.add);
  const [results, setResults] = useState<RecipeMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const state = location.state as HomeNavigationState | null;
    if (!state?.preloadedResults) return;
    setResults(state.preloadedResults);
    setHasSearched(true);
    scrollToResults();
    window.history.replaceState({}, document.title, window.location.href);
  }, [location.state]);

  const language = i18n.language.startsWith('en') ? 'en' : 'ro';
  const quickIngredients = ['potatoes', 'eggs', 'onion', 'cheese', 'chicken', 'tomatoes'] as const;

  const scrollToResults = () => {
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior, block: 'start' }));
  };

  const findRecipes = async () => {
    if (ingredients.length === 0 || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(false);
    setHasSearched(true);

    try {
      const matches = await matchRecipes({ ingredients, language });
      setResults(matches);
      scrollToResults();
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">{t('eyebrow', { ns: 'home' })}</p>
        <h1 className="text-4xl font-semibold leading-tight text-zinc-50 sm:text-6xl">{t('heroTitle', { ns: 'home' })}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">{t('heroSubtitle', { ns: 'home' })}</p>

        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-zinc-900/80 p-4 text-left shadow-2xl shadow-emerald-950/20 sm:p-6">
          <IngredientInput />
          <button type="button" onClick={() => void findRecipes()} disabled={ingredients.length === 0 || isLoading} className="mt-4 w-full rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
            {isLoading ? t('loadingButton', { ns: 'home' }) : t('findButton', { ns: 'home' })}
          </button>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label={t('quickSuggestionsLabel', { ns: 'home' })}>
            <span className="mr-1 text-xs text-zinc-500">{t('quickSuggestions', { ns: 'home' })}</span>
            {quickIngredients.map((ingredient) => (
              <button key={ingredient} type="button" onClick={() => addIngredient(t(`quickIngredients.${ingredient}`, { ns: 'home' }))} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-300">
                + {t(`quickIngredients.${ingredient}`, { ns: 'home' })}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!hasSearched && (
        <section className="mx-auto max-w-3xl" aria-labelledby="how-it-works-title">
          <h2 id="how-it-works-title" className="text-center text-lg font-semibold text-zinc-200">{t('howTitle', { ns: 'home' })}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(['choose', 'match', 'cook'] as const).map((step, index) => (
              <div key={step} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900/70 text-lg text-emerald-300" aria-hidden="true">{['1', '2', '3'][index]}</div>
                <h3 className="mt-3 text-sm font-semibold text-zinc-200">{t(`steps.${step}.title`, { ns: 'home' })}</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{t(`steps.${step}.description`, { ns: 'home' })}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section ref={resultsRef} className="scroll-mt-24" aria-live="polite">
        {isLoading && <ResultsSkeleton label={t('loadingResults', { ns: 'home' })} />}
        {!isLoading && error && (
          <div className="mx-auto max-w-xl rounded-xl border border-red-900/60 bg-red-950/20 p-6 text-center">
            <h2 className="font-semibold text-red-200">{t('errorTitle', { ns: 'home' })}</h2>
            <p className="mt-2 text-sm text-red-300/80">{t('errorDescription', { ns: 'home' })}</p>
            <button type="button" onClick={() => void findRecipes()} className="mt-4 rounded-lg border border-red-700 px-4 py-2 text-sm text-red-200 hover:bg-red-900/40">{t('retry', { ns: 'home' })}</button>
          </div>
        )}
        {!isLoading && !error && hasSearched && results.length === 0 && (
          <div className="mx-auto max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
            <h2 className="font-semibold text-zinc-200">{t('emptyResultsTitle', { ns: 'home' })}</h2>
            <p className="mt-2 text-sm text-zinc-400">{t('emptyResultsDescription', { ns: 'home' })}</p>
          </div>
        )}
        {!isLoading && !error && results.length > 0 && <MatchResults results={results} />}
      </section>
    </div>
  );
};

const ResultsSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2" aria-label={label} aria-busy="true">
    {[0, 1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />)}
  </div>
);

