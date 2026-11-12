import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { MatchStatus, RecipeMatch } from '@/api/types';
import { shoppingListSelectors, useShoppingListStore } from '@/store';

import { RecipeCard } from './RecipeCard';

interface ResultGroup {
  key: 'ready' | 'oneMissing' | 'manyMissing';
  statuses: MatchStatus[];
  tone: string;
}

const groups: ResultGroup[] = [
  { key: 'ready', statuses: ['CanCookNow'], tone: 'border-status-success/30 bg-status-success/10 text-status-success' },
  { key: 'oneMissing', statuses: ['OneMissing'], tone: 'border-status-warning/30 bg-status-warning/10 text-status-warning' },
  { key: 'manyMissing', statuses: ['FewMissing', 'ManyMissing'], tone: 'border-border bg-surface/60 text-text-secondary' },
];

export interface MatchResultsProps {
  results: RecipeMatch[];
}

export const MatchResults: React.FC<MatchResultsProps> = ({ results }) => {
  const { t } = useTranslation('home');
  const addMany = useShoppingListStore(shoppingListSelectors.addMany);
  const [visibleCounts, setVisibleCounts] = useState<Record<ResultGroup['key'], number>>({ ready: 12, oneMissing: 12, manyMissing: 12 });

  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const matches = results.filter((result) => group.statuses.includes(result.matchStatus));
        if (matches.length === 0) {
          return null;
        }

        const visible = matches.slice(0, visibleCounts[group.key]);
        return (
          <section key={group.key} aria-labelledby={`${group.key}-heading`}>
            <div className={`mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${group.tone}`}>
              <h2 id={`${group.key}-heading`} className="text-xl font-semibold"><span aria-hidden="true">{group.key === 'ready' ? '✓ ' : '! '}</span>{t(`groups.${group.key}`, { ns: 'home' })}</h2>
              <span className="text-sm">{t('recipeCount', { ns: 'home', count: matches.length })}</span>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((result) => (
                <RecipeCard key={result.recipe.slug} recipe={result.recipe} match={result} showMissingIngredients={group.key !== 'ready'} onAddMissing={group.key !== 'ready' ? (missing) => addMany(missing, result.recipe.slug) : undefined} />
              ))}
            </div>
            {visible.length < matches.length && (
              <button type="button" onClick={() => setVisibleCounts((current) => ({ ...current, [group.key]: current[group.key] + 12 }))} className="mx-auto mt-5 block rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:border-accent/30 hover:text-accent">
                {t('showMore', { ns: 'home' })}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
};

export const MemoizedMatchResults = React.memo(MatchResults);