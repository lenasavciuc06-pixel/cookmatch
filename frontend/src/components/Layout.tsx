import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const Layout: React.FC = () => {
  const { t } = useTranslation('common');

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-800/60 text-emerald-300 border border-emerald-600/50'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
    }`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={t('app.title')}>
              🥦
            </span>
            <div>
              <span className="text-lg font-bold tracking-tight text-emerald-400">{t('app.title')}</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-zinc-400">
                {t('app.tagline')}
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" className={navItemClass} end>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/recipes" className={navItemClass}>
              {t('nav.recipes')}
            </NavLink>
            <NavLink to="/favorites" className={navItemClass}>
              {t('nav.favorites')}
            </NavLink>
            <NavLink to="/shopping-list" className={navItemClass}>
              {t('nav.shoppingList')}
            </NavLink>

            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-900/40 py-6 text-center text-xs text-zinc-500">
        <p>{t('app.title')} &copy; {new Date().getFullYear()} &mdash; {t('footer')}</p>
      </footer>
    </div>
  );
};

