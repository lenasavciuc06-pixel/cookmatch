import catalogPhotos from '@/assets/recipe-photos.json';

export interface RecipePhoto {
  file: string | null;
  width?: number;
  height?: number;
}

const photos: Record<string, RecipePhoto> = catalogPhotos;

export function getRecipePhoto(slug: string): RecipePhoto | undefined {
  return photos[slug];
}

export function recipeImageSource(source: string, slug: string): string {
  const photo = getRecipePhoto(slug);
  // Known unavailable/rejected photos must never fall back to an old shared image.
  return photo ? photo.file ?? '' : source;
}
