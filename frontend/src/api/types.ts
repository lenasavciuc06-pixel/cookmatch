export type MatchStatus = 'CanCookNow' | 'OneMissing' | 'FewMissing' | 'ManyMissing';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type RecipeCategory =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Dessert'
  | 'Soup'
  | 'Salad'
  | 'Pasta'
  | 'Meat'
  | 'Vegetarian'
  | 'Quick'
  | 'Budget';
export type Language = 'ro' | 'en';

export interface RecipeSummary {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  category: RecipeCategory;
  prepTimeMinutes: number;
  difficulty: Difficulty;
  servings: number;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  isPantryStaple: boolean;
  isAvailable: boolean;
}

export interface Recipe {
  recipe: RecipeSummary;
  instructions: string[];
  ingredients: RecipeIngredient[];
}

export interface RecipeMatch {
  recipe: RecipeSummary;
  matchStatus: MatchStatus;
  missingCount: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export interface Ingredient {
  name: string;
  isPantryStaple: boolean;
}

export interface Category {
  value: RecipeCategory;
  labelRo: string;
  labelEn: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface HealthResponse {
  status: string;
}

