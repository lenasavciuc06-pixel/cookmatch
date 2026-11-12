import React from 'react';
import { useTranslation } from 'react-i18next';

export const StyleGuidePage: React.FC = () => {
  const { t } = useTranslation('common');
  return <h1 className="text-2xl font-bold text-text-primary">{t('styleGuide')}</h1>;
};