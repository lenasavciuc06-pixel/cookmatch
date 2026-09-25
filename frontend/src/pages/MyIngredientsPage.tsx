import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { matchRecipes } from '@/api/client';
import type { RecipeMatch } from '@/api/types';
import { IngredientInput } from '@/features/ingredients';
import { useAsync } from '@/lib/useAsync';
import { ingredientsSelectors, useIngredientsStore } from '@/store';

export const MyIngredientsPage: React.FC = () => {
  const { t } = useTranslation('ingredients');
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const items = useIngredientsStore(ingredientsSelectors.items);
  const update = useIngredientsStore(ingredientsSelectors.update);
  const remove = useIngredientsStore(ingredientsSelectors.remove);
  const clear = useIngredientsStore(ingredientsSelectors.clear);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const { isLoading: isMatching, run: runMatch } = useAsync<RecipeMatch[]>();

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? items.filter((item) => item.toLocaleLowerCase().includes(query)) : items;
  }, [items, search]);

  const toggleSelected = (name: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const saveEdit = (name: string) => {
    const value = draft.trim();
    if (value && value !== name) update(name, value);
    setEditing(null);
  };

  const deleteSelected = () => {
    selected.forEach(remove);
    setSelected(new Set());
  };

  const findRecipes = async () => {
    if (items.length === 0 || isMatching) return;
    const language = i18n.language.startsWith('en') ? 'en' : 'ro';
    const results = await runMatch(() => matchRecipes({ ingredients: items, language }));
    if (results) navigate('/', { state: { preloadedResults: results } });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">{t('description')}</p>
      </header>

      <section className="rounded-xl border border-emerald-500/30 bg-zinc-900/70 p-4 shadow-lg shadow-emerald-950/10 sm:p-6">
        <IngredientInput className="text-base" />
        <p className="mt-4 border-l-2 border-amber-500/70 pl-3 text-sm text-amber-200/80">{t('sessionNotice')}</p>
      </section>

      <section className="space-y-4" aria-labelledby="ingredient-list-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ingredient-list-title" className="text-lg font-semibold text-zinc-100">{t('currentTitle', { count: items.length })}</h2>
          {items.length > 0 && <button type="button" onClick={clear} className="text-sm text-zinc-400 hover:text-white">{t('clearAll')}</button>}
        </div>
        {items.length > 6 && <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchPlaceholder')} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500" />}
        {items.length === 0 ? <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">{t('empty')}</p> : (
          <>
            <div className="flex flex-wrap gap-2">
              {filteredItems.map((name) => (
                <div key={name} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${selected.has(name) ? 'border-emerald-500 bg-emerald-950/50' : 'border-zinc-700 bg-zinc-900'}`}>
                  <input type="checkbox" checked={selected.has(name)} onChange={() => toggleSelected(name)} aria-label={t('select', { name })} className="accent-emerald-500" />
                  {editing === name ? <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => saveEdit(name)} onKeyDown={(event) => { if (event.key === 'Enter') saveEdit(name); if (event.key === 'Escape') setEditing(null); }} className="w-28 bg-transparent text-sm text-zinc-100 outline-none" /> : <button type="button" onClick={() => { setEditing(name); setDraft(name); }} className="text-sm text-zinc-200 hover:text-emerald-300">{name}</button>}
                  <button type="button" onClick={() => remove(name)} aria-label={t('remove', { name })} className="text-zinc-500 hover:text-red-300">×</button>
                </div>
              ))}
            </div>
            {filteredItems.length === 0 && <p className="text-sm text-zinc-500">{t('noSearchResults')}</p>}
            {selected.size > 0 && <button type="button" onClick={deleteSelected} className="rounded-lg border border-red-800/70 px-3 py-2 text-sm text-red-300 hover:bg-red-950/40">{t('deleteSelected', { count: selected.size })}</button>}
          </>
        )}
      </section>

      <button type="button" disabled={items.length === 0 || isMatching} onClick={() => void findRecipes()} className="w-full rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
        {isMatching ? t('matching') : t('findRecipes')}
      </button>
    </div>
  );
};