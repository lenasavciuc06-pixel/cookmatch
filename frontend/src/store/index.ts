import { create } from 'zustand';

interface AppState {
  selectedIngredients: string[];
  favoriteRecipeIds: number[];
  shoppingListItems: string[];
  addIngredient: (ingredient: string) => void;
  removeIngredient: (ingredient: string) => void;
  toggleFavorite: (recipeId: number) => void;
  addToShoppingList: (item: string) => void;
  removeFromShoppingList: (item: string) => void;
  clearIngredients: () => void;
}

// Stare pur în memorie (fără localStorage/cookies conform deciziilor de produs)
export const useAppStore = create<AppState>((set) => ({
  selectedIngredients: [],
  favoriteRecipeIds: [],
  shoppingListItems: [],
  addIngredient: (ingredient) =>
    set((state) => ({
      selectedIngredients: state.selectedIngredients.includes(ingredient)
        ? state.selectedIngredients
        : [...state.selectedIngredients, ingredient],
    })),
  removeIngredient: (ingredient) =>
    set((state) => ({
      selectedIngredients: state.selectedIngredients.filter((i) => i !== ingredient),
    })),
  toggleFavorite: (recipeId) =>
    set((state) => ({
      favoriteRecipeIds: state.favoriteRecipeIds.includes(recipeId)
        ? state.favoriteRecipeIds.filter((id) => id !== recipeId)
        : [...state.favoriteRecipeIds, recipeId],
    })),
  addToShoppingList: (item) =>
    set((state) => ({
      shoppingListItems: state.shoppingListItems.includes(item)
        ? state.shoppingListItems
        : [...state.shoppingListItems, item],
    })),
  removeFromShoppingList: (item) =>
    set((state) => ({
      shoppingListItems: state.shoppingListItems.filter((i) => i !== item),
    })),
  clearIngredients: () => set({ selectedIngredients: [] }),
}));

