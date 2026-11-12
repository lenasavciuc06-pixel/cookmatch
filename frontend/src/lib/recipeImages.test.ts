import { describe, expect, it } from 'vitest';

import photos from '@/assets/recipe-photos.json';

import { getRecipePhoto, recipeImageSource } from './recipeImages';

describe('recipe photograph assignments', () => {
  it('assigns a separate local photograph to each accepted recipe', () => {
    const assigned = Object.values(photos).filter(p => p.file);
    expect(Object.keys(photos)).toHaveLength(300);
    expect(assigned.length).toBe(289);
    expect(new Set(assigned.map(p => p.file)).size).toBe(289);
    expect(recipeImageSource('shared.jpg', 'omleta-cu-ceapa-si-branza')).toBe('/images/recipes/omleta-cu-ceapa-si-branza.jpg');
    expect(recipeImageSource('shared.jpg', 'omleta-cu-ardei-si-branza')).toBe('/images/recipes/omleta-cu-ardei-si-branza.jpg');
    expect(getRecipePhoto('omleta-cu-ceapa-si-branza')).toMatchObject({ width: 774, height: 544 });
  });
  it('does not substitute old shared photographs for failed or rejected candidates', () => {
    expect(recipeImageSource('old-shared-photo.jpg', 'supa-crema-de-naut-si-spanac')).toBe('');
    expect(recipeImageSource('old-shared-photo.jpg', 'tortilla-spanac-si-branza')).toBe('');
  });
  it('preserves explicit API images for recipes outside the supplied catalog', () => {
    expect(recipeImageSource('/images/new-recipe.jpg', 'outside-supplied-catalog')).toBe('/images/new-recipe.jpg');
  });
});
