import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getRecipePhoto, recipeImageSource } from '@/lib/recipeImages';

export const RecipeImage: React.FC<{ src: string; slug: string; alt: string; className?: string }> = ({ src, slug, alt, className }) => {
  const { t } = useTranslation('recipes');
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSource = recipeImageSource(src, slug);
  const photo = getRecipePhoto(slug);
  if (!imageSource || failedSrc === imageSource) {
    return <div role="img" aria-label={t('imageUnavailable')} className={`flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 bg-sage text-text-muted ${className ?? ''}`}><span aria-hidden="true" className="text-4xl">♧</span><span className="text-sm">{t('imageUnavailable')}</span></div>;
  }
  return <img src={imageSource} alt={alt} width={photo?.width} height={photo?.height} loading="lazy" decoding="async" onError={() => setFailedSrc(imageSource)} className={className} />;
};
