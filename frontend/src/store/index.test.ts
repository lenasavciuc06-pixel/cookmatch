import { beforeEach, describe, expect, it } from 'vitest';

import {
  useFavoritesStore,
  useIngredientsStore,
  useShoppingListStore,
} from '@/store';

describe('useIngredientsStore', () => {
  beforeEach(() => useIngredientsStore.getState().clear());

  it('prevents duplicates after minimal normalization', () => {
    useIngredientsStore.getState().add('Ceapă');
    useIngredientsStore.getState().add('ceapa');

    expect(useIngredientsStore.getState().items).toEqual(['Ceapă']);
  });
});

describe('useFavoritesStore', () => {
  beforeEach(() => useFavoritesStore.getState().clear());

  it('toggles a favorite slug', () => {
    useFavoritesStore.getState().toggle('reteta-1');
    expect(useFavoritesStore.getState().has('reteta-1')).toBe(true);

    useFavoritesStore.getState().toggle('reteta-1');
    expect(useFavoritesStore.getState().has('reteta-1')).toBe(false);
  });
});

describe('useShoppingListStore', () => {
  beforeEach(() => useShoppingListStore.setState({ items: [] }));

  it('adds many items without overlap with existing or incoming items', () => {
    useShoppingListStore.getState().addMany(['Cartofi', 'ceapă'], 'reteta-1');
    useShoppingListStore.getState().addMany(['cartofi', 'brânză'], 'reteta-2');

    expect(useShoppingListStore.getState().items).toEqual([
      { name: 'Cartofi', checked: false, fromRecipe: 'reteta-1' },
      { name: 'ceapă', checked: false, fromRecipe: 'reteta-1' },
      { name: 'brânză', checked: false, fromRecipe: 'reteta-2' },
    ]);
  });
});