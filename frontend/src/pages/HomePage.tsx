import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { matchRecipes } from '@/api/client';
import type { RecipeMatch } from '@/api/types';
import { IngredientInput } from '@/features/ingredients';
import { MemoizedMatchResults } from '@/features/recipes';
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
    <div className="space-y-12 lg:space-y-16">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14" aria-labelledby="home-title">
        <div className="min-w-0">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{t('eyebrow', { ns: 'home' })}</p>
          <h1 id="home-title" className="max-w-xl text-5xl leading-[1.05] text-text-primary sm:text-6xl lg:text-7xl">{t('heroTitle', { ns: 'home' })}</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-text-secondary sm:text-lg">{t('heroSubtitle', { ns: 'home' })}</p>
          <div className="mt-7 rounded-2xl border border-border/70 bg-surface p-4 shadow-soft sm:p-6">
            <IngredientInput />
            <p className="mt-2 text-xs leading-5 text-text-muted">{t('inputHint', { ns: 'home' })}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={t('quickSuggestionsLabel', { ns: 'home' })}>
              <span className="mr-1 text-xs text-text-muted">{t('quickSuggestions', { ns: 'home' })}</span>
              {quickIngredients.map((ingredient) => (
                <button key={ingredient} type="button" onClick={() => addIngredient(t(`quickIngredients.${ingredient}`, { ns: 'home' }))} className="rounded-full border border-border bg-canvas px-3 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:bg-sage">
                  + {t(`quickIngredients.${ingredient}`, { ns: 'home' })}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => void findRecipes()} disabled={ingredients.length === 0 || isLoading} className="primary-button mt-5 w-full">
              {isLoading ? t('loadingButton', { ns: 'home' }) : t('findButton', { ns: 'home' })}
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <section className="mt-6" aria-labelledby="how-it-works-title">
            <h2 id="how-it-works-title" className="sr-only">{t('howTitle', { ns: 'home' })}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['choose', 'match', 'cook'] as const).map((step, index) => (
                <div key={step} className="flex items-start gap-3 sm:block">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-olive/40 text-xs font-semibold text-text-muted" aria-hidden="true">0{index + 1}</span>
                  <div><h3 className="text-base font-semibold text-text-primary sm:mt-2">{t(`steps.${step}.title`, { ns: 'home' })}</h3>
                  <p className="mt-1 text-xs leading-5 text-text-muted">{t(`steps.${step}.description`, { ns: 'home' })}</p></div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <figure className="relative mx-auto w-full max-w-lg lg:pt-2">
          <div aria-hidden="true" className="absolute -right-2 top-5 h-24 w-24 rounded-full bg-terracotta/15 sm:h-40 sm:w-40" />
          <div className="hero-photo relative h-48 overflow-hidden bg-sage sm:h-80 lg:h-[35rem]">
            <img src="/images/seasonal-salad.jpg" alt={t('photoAlt', { ns: 'home' })} width={1000} height={1200} fetchPriority="high" className="h-full w-full object-cover" />
          </div>
          <figcaption className="relative mx-5 -mt-6 rounded-xl border border-border/60 bg-surface px-5 py-4 text-center font-serif text-lg italic text-text-primary shadow-soft sm:mx-8">
            {t('photoCaption', { ns: 'home' })}
          </figcaption>
        </figure>
      </section>

      {hasSearched && <section ref={resultsRef} className="scroll-mt-24" aria-live="polite">
        {isLoading && <ResultsSkeleton label={t('loadingResults', { ns: 'home' })} />}
        {!isLoading && error && (
          <div className="mx-auto max-w-xl rounded-xl border border-status-danger/30 bg-status-danger/10 p-6 text-center">
            <h2 className="font-semibold text-status-danger">{t('errorTitle', { ns: 'home' })}</h2>
            <p className="mt-2 text-sm text-status-danger">{t('errorDescription', { ns: 'home' })}</p>
            <button type="button" onClick={() => void findRecipes()} className="mt-4 rounded-lg border border-status-danger/30 px-4 py-2 text-sm text-status-danger hover:bg-status-danger/10">{t('retry', { ns: 'home' })}</button>
          </div>
        )}
        {!isLoading && !error && hasSearched && results.length === 0 && (
          <div className="state-panel">
            <h2 className="font-semibold text-text-primary">{t('emptyResultsTitle', { ns: 'home' })}</h2>
            <p className="mt-2 text-sm text-text-muted">{t('emptyResultsDescription', { ns: 'home' })}</p>
          </div>
        )}
        {!isLoading && !error && results.length > 0 && <MemoizedMatchResults results={results} />}
      </section>}
    </div>
  );
};

const ResultsSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2" aria-label={label} aria-busy="true">
    {[0, 1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl border border-border bg-surface/60" />)}
  </div>
);

