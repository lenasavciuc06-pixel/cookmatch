import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="text-4xl font-extrabold text-accent">404</h1>
      <p className="text-text-muted text-lg">{t('common.notFound')}</p>
      <div>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-accent hover:bg-accent text-on-accent font-medium text-sm transition"
        >
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  );
};

