import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Layout } from '@/components/Layout';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RecipesPage } from '@/pages/RecipesPage';
import { ShoppingListPage } from '@/pages/ShoppingListPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="shopping-list" element={<ShoppingListPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
