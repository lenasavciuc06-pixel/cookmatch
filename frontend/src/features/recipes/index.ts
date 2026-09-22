export interface Recipe {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  prepTimeMinutes: number;
  ingredients: string[];
}

