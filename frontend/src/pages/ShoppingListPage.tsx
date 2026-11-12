import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { shoppingListSelectors, useShoppingListStore } from '@/store';

export const ShoppingListPage: React.FC = () => {
  const { t } = useTranslation('shopping');
  const items = useShoppingListStore(shoppingListSelectors.items);
  const addMany = useShoppingListStore(shoppingListSelectors.addMany);
  const toggleChecked = useShoppingListStore(shoppingListSelectors.toggleChecked);
  const clearChecked = useShoppingListStore(shoppingListSelectors.clearChecked);
  const clear = useShoppingListStore(shoppingListSelectors.clear);
  const [manualItem, setManualItem] = useState('');
  const [copied, setCopied] = useState(false);

  const sortedItems = useMemo(() => [...items].sort((left, right) => Number(left.checked) - Number(right.checked)), [items]);
  const groups = useMemo(() => {
    const grouped = new Map<string, typeof sortedItems>();
    sortedItems.forEach((item) => {
      const key = item.fromRecipe ?? t('manualGroup');
      const group = grouped.get(key) ?? [];
      group.push(item);
      grouped.set(key, group);
    });
    return grouped;
  }, [sortedItems, t]);

  const addManualItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manualItem.trim()) return;
    addMany([manualItem]);
    setManualItem('');
  };

  const copyList = async () => {
    const text = sortedItems.map((item) => `${item.checked ? '[x]' : '[ ]'} ${item.name}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text-primary">{t('title')}</h1>
        <p className="mt-2 text-sm text-text-muted">{t('description', { count: items.length })}</p>
      </header>

      <form onSubmit={addManualItem} className="flex gap-2">
        <input value={manualItem} onChange={(event) => setManualItem(event.target.value)} placeholder={t('manualPlaceholder')} className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/30" />
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent">{t('add')}</button>
      </form>

      {items.length === 0 ? <div className="rounded-lg border border-border bg-surface/50 p-10 text-center"><h2 className="font-semibold text-text-primary">{t('emptyTitle')}</h2><p className="mt-2 text-sm text-text-muted">{t('emptyDescription')}</p></div> : (
        <>
          <div className="space-y-6">
            {Array.from(groups.entries()).map(([groupName, groupItems]) => <section key={groupName} aria-labelledby={`shopping-group-${groupName}`}><h2 id={`shopping-group-${groupName}`} className="mb-2 break-words text-sm font-semibold uppercase tracking-wide text-text-secondary">{groupName}</h2><ul className="divide-y divide-border rounded-lg border border-border bg-surface/50">{groupItems.map((item) => <li key={item.name} className={`flex items-center gap-3 px-4 py-3 ${item.checked ? 'text-text-muted' : 'text-text-primary'}`}><input type="checkbox" checked={item.checked} onChange={() => toggleChecked(item.name)} aria-label={t('check', { name: item.name })} className="h-4 w-4 shrink-0 accent-accent" /><span className={`min-w-0 break-words ${item.checked ? 'line-through' : ''}`}>{item.name}</span></li>)}</ul></section>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={clearChecked} disabled={!items.some((item) => item.checked)} className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-accent/30 disabled:opacity-40">{t('clearChecked')}</button>
            <button type="button" onClick={clear} className="rounded-lg border border-status-danger/30 px-3 py-2 text-sm text-status-danger hover:bg-status-danger/10">{t('clearAll')}</button>
            <button type="button" onClick={() => void copyList()} className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-accent/30">{copied ? t('copied') : t('copy')}</button>
          </div>
        </>
      )}
    </div>
  );
};

