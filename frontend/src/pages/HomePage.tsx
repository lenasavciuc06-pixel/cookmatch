import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { checkHealth } from '@/api/client';
import { ingredientsSelectors, useIngredientsStore } from '@/store';

export const HomePage: React.FC = () => {
  const { t } = useTranslation(['common', 'home']);
  const selectedIngredients = useIngredientsStore(ingredientsSelectors.items);
  const [backendStatus, setBackendStatus] = useState<string>('checking');

  useEffect(() => {
    checkHealth()
      .then((res) => setBackendStatus(res.status))
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100 sm:text-4xl">
          {t('app.title')}
        </h1>
        <p className="mt-2 text-lg text-zinc-400">{t('app.tagline')}</p>

        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <span>{t('common.status')} API:</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              backendStatus === 'ok'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {backendStatus === 'checking' ? t('common.checking') : backendStatus === 'offline' ? t('common.offline') : backendStatus}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6">
        <h2 className="text-xl font-semibold text-zinc-200">{t('selectedIngredients', { ns: 'home' })}</h2>
        <p className="text-sm text-zinc-400 mt-1">
          {selectedIngredients.length === 0
            ? t('emptyIngredients', { ns: 'home' })
            : t('ingredientCount', { ns: 'home', count: selectedIngredients.length })}
        </p>
      </div>
    </div>
  );
};

