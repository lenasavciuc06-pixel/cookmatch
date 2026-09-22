import { create } from 'zustand';

import { normalizeIngredient } from '@/lib/normalize';

export interface IngredientsState {
  items: string[];
  add: (name: string) => void;
  remove: (name: string) => void;
  update: (oldName: string, newName: string) => void;
  clear: () => void;
}

export interface FavoritesState {
  slugs: Set<string>;
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
}

export interface ShoppingListItem {
  name: string;
  checked: boolean;
  fromRecipe?: string;
}

export interface ShoppingListState {
  items: ShoppingListItem[];
  addMany: (names: string[], fromRecipe?: string) => void;
  toggleChecked: (name: string) => void;
  remove: (name: string) => void;
  clearChecked: () => void;
}

export const useIngredientsStore = create<IngredientsState>((set) => ({
  items: [],
  add: (name) =>
    set((state) => {
      const normalizedName = normalizeIngredient(name);

      if (!normalizedName || state.items.some((item) => normalizeIngredient(item) === normalizedName)) {
        return state;
      }

      return { items: [...state.items, name.trim()] };
    }),
  remove: (name) =>
    set((state) => ({
      items: state.items.filter((item) => normalizeIngredient(item) !== normalizeIngredient(name)),
    })),
  update: (oldName, newName) =>
    set((state) => {
      const normalizedNewName = normalizeIngredient(newName);
      const oldIndex = state.items.findIndex((item) => normalizeIngredient(item) === normalizeIngredient(oldName));

      if (oldIndex === -1 || !normalizedNewName) {
        return state;
      }

      const duplicateIndex = state.items.findIndex((item) => normalizeIngredient(item) === normalizedNewName);
      if (duplicateIndex !== -1 && duplicateIndex !== oldIndex) {
        return state;
      }

      const items = [...state.items];
      items[oldIndex] = newName.trim();
      return { items };
    }),
  clear: () => set({ items: [] }),
}));

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  slugs: new Set<string>(),
  toggle: (slug) =>
    set((state) => {
      const slugs = new Set(state.slugs);
      if (slugs.has(slug)) {
        slugs.delete(slug);
      } else {
        slugs.add(slug);
      }
      return { slugs };
    }),
  has: (slug) => get().slugs.has(slug),
  clear: () => set({ slugs: new Set<string>() }),
}));

export const useShoppingListStore = create<ShoppingListState>((set) => ({
  items: [],
  addMany: (names, fromRecipe) =>
    set((state) => {
      const existingNames = new Set(state.items.map((item) => normalizeIngredient(item.name)));
      const additions = names
        .map((name) => name.trim())
        .filter((name) => {
          const normalizedName = normalizeIngredient(name);
          if (!normalizedName || existingNames.has(normalizedName)) {
            return false;
          }
          existingNames.add(normalizedName);
          return true;
        })
        .map((name) => ({ name, checked: false, fromRecipe }));

      return additions.length === 0 ? state : { items: [...state.items, ...additions] };
    }),
  toggleChecked: (name) =>
    set((state) => ({
      items: state.items.map((item) =>
        normalizeIngredient(item.name) === normalizeIngredient(name)
          ? { ...item, checked: !item.checked }
          : item,
      ),
    })),
  remove: (name) =>
    set((state) => ({
      items: state.items.filter((item) => normalizeIngredient(item.name) !== normalizeIngredient(name)),
    })),
  clearChecked: () => set((state) => ({ items: state.items.filter((item) => !item.checked) })),
}));

export const ingredientsSelectors = {
  items: (state: IngredientsState) => state.items,
  add: (state: IngredientsState) => state.add,
  remove: (state: IngredientsState) => state.remove,
  update: (state: IngredientsState) => state.update,
  clear: (state: IngredientsState) => state.clear,
};

export const favoritesSelectors = {
  slugs: (state: FavoritesState) => state.slugs,
  toggle: (state: FavoritesState) => state.toggle,
  has: (state: FavoritesState) => state.has,
  clear: (state: FavoritesState) => state.clear,
};

export const shoppingListSelectors = {
  items: (state: ShoppingListState) => state.items,
  addMany: (state: ShoppingListState) => state.addMany,
  toggleChecked: (state: ShoppingListState) => state.toggleChecked,
  remove: (state: ShoppingListState) => state.remove,
  clearChecked: (state: ShoppingListState) => state.clearChecked,
};

