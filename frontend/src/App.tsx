import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Layout } from '@/components/Layout';

const HomePage = lazy(() => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })));
const RecipesPage = lazy(() => import('@/pages/RecipesPage').then((module) => ({ default: module.RecipesPage })));
const RecipeDetailsPage = lazy(() => import('@/pages/RecipeDetailsPage').then((module) => ({ default: module.RecipeDetailsPage })));
const MyIngredientsPage = lazy(() => import('@/pages/MyIngredientsPage').then((module) => ({ default: module.MyIngredientsPage })));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage').then((module) => ({ default: module.FavoritesPage })));
const ShoppingListPage = lazy(() => import('@/pages/ShoppingListPage').then((module) => ({ default: module.ShoppingListPage })));
const StyleGuidePage = lazy(() => import('@/pages/StyleGuidePage').then((module) => ({ default: module.StyleGuidePage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

const RouteFallback: React.FC = () => {
  const { t } = useTranslation('common');
  return <div className="p-8 text-sm text-zinc-400">{t('common.loading')}</div>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="recipes/:slug" element={<RecipeDetailsPage />} />
            <Route path="my-ingredients" element={<MyIngredientsPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="shopping-list" element={<ShoppingListPage />} />
            <Route path="style-guide" element={<StyleGuidePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
