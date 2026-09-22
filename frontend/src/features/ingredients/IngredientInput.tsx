import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getIngredients } from '@/api/client';
import type { Ingredient } from '@/api/types';
import { normalizeIngredient } from '@/lib/normalize';
import { ingredientsSelectors, useIngredientsStore } from '@/store';

let ingredientCatalogPromise: Promise<Ingredient[]> | null = null;

function loadIngredientCatalog(): Promise<Ingredient[]> {
  ingredientCatalogPromise ??= getIngredients();
  return ingredientCatalogPromise;
}

export interface IngredientInputProps {
  className?: string;
}

export const IngredientInput: React.FC<IngredientInputProps> = ({ className }) => {
  const { t } = useTranslation('ingredients');
  const items = useIngredientsStore(ingredientsSelectors.items);
  const add = useIngredientsStore(ingredientsSelectors.add);
  const remove = useIngredientsStore(ingredientsSelectors.remove);
  const inputId = useId();
  const listboxId = `${inputId}-suggestions`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [catalog, setCatalog] = useState<Ingredient[]>([]);
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [duplicateFeedback, setDuplicateFeedback] = useState(false);
  const feedbackTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    void loadIngredientCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = normalizeIngredient(inputValue);
      if (!query) {
        setSuggestions([]);
        setActiveIndex(-1);
        return;
      }

      const existing = new Set(items.map(normalizeIngredient));
      setSuggestions(
        catalog
          .filter((ingredient) => !existing.has(normalizeIngredient(ingredient.name)))
          .filter((ingredient) => normalizeIngredient(ingredient.name).includes(query))
          .slice(0, 8),
      );
      setActiveIndex(-1);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [catalog, inputValue, items]);

  useEffect(() => () => window.clearTimeout(feedbackTimerRef.current), []);

  const showDuplicateFeedback = () => {
    setDuplicateFeedback(true);
    window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setDuplicateFeedback(false), 1200);
  };

  const confirmIngredient = (value: string) => {
    const name = value.trim();
    if (!name) {
      return false;
    }

    const normalizedName = normalizeIngredient(name);
    if (items.some((item) => normalizeIngredient(item) === normalizedName)) {
      showDuplicateFeedback();
      return false;
    }

    add(name);
    return true;
  };

  const confirmInput = () => {
    const selected = activeIndex >= 0 ? suggestions[activeIndex]?.name : undefined;
    if (selected) {
      confirmIngredient(selected);
    } else {
      confirmIngredient(inputValue);
    }
    setInputValue('');
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleChange = (value: string) => {
    const parts = value.split(/[\n,]/);
    if (parts.length === 1) {
      setInputValue(value);
      return;
    }

    parts.slice(0, -1).forEach(confirmIngredient);
    setInputValue(parts.at(-1) ?? '');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Escape') {
      setSuggestions([]);
      setActiveIndex(-1);
    } else if (event.key === 'Backspace' && !inputValue && items.length > 0) {
      remove(items.at(-1) ?? '');
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      if (inputValue.trim() || activeIndex >= 0) {
        if (event.key === 'Enter') {
          event.preventDefault();
        }
        confirmInput();
      }
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      confirmInput();
    }
    window.setTimeout(() => setSuggestions([]), 120);
  };

  return (
    <div className={className}>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-emerald-500">
        {items.map((item) => (
          <span key={normalizeIngredient(item)} className="inline-flex items-center gap-1 rounded-full bg-emerald-900/70 px-3 py-1 text-sm text-emerald-100" aria-label={t('chip', { name: item })}>
            {item}
            <button type="button" onClick={() => remove(item)} aria-label={t('remove', { name: item })} className="rounded-full px-1 text-emerald-300 hover:bg-emerald-700 hover:text-white">
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          value={inputValue}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          aria-label={t('inputLabel')}
          placeholder={t('placeholder')}
          className="min-w-40 flex-1 bg-transparent py-1 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
        />
        {items.length > 0 && (
          <button type="button" onClick={() => useIngredientsStore.getState().clear()} className="text-xs text-zinc-400 hover:text-white">
            {t('clearAll')}
          </button>
        )}
      </div>

      {duplicateFeedback && <p role="status" className="mt-2 text-sm text-amber-300">{t('duplicate')}</p>}
      {suggestions.length > 0 && (
        <ul id={listboxId} role="listbox" className="mt-1 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.name} id={`${listboxId}-${index}`} role="option" aria-selected={index === activeIndex}>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { confirmIngredient(suggestion.name); setInputValue(''); setSuggestions([]); }} className={`w-full px-3 py-2 text-left text-sm ${index === activeIndex ? 'bg-emerald-800 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                {suggestion.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};