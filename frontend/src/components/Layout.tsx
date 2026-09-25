import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { favoritesSelectors, shoppingListSelectors, useFavoritesStore, useShoppingListStore } from '@/store';

export const Layout: React.FC = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const favoriteCount = useFavoritesStore(favoritesSelectors.slugs).size;
  const shoppingCount = useShoppingListStore(shoppingListSelectors.items).length;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      menuButtonRef.current?.focus();
      return;
    }

    firstMenuLinkRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }

      if (event.key === 'Tab' && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>('a, button');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-800/60 text-emerald-300 border border-emerald-600/50'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
    }`;

  const navigation = (
    <>
      <NavLink ref={firstMenuLinkRef} to="/" className={navItemClass} end>
        {t('nav.home')}
      </NavLink>
      <NavLink to="/recipes" className={navItemClass}>
        {t('nav.recipes')}
      </NavLink>
      <NavLink to="/my-ingredients" className={navItemClass}>
        {t('nav.myIngredients')}
      </NavLink>
      <NavLink to="/favorites" className={navItemClass}>
        {t('nav.favorites')}
        {favoriteCount > 0 && <span className="ml-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] text-zinc-950">{favoriteCount}</span>}
      </NavLink>
      <NavLink to="/shopping-list" className={navItemClass}>
        {t('nav.shoppingList')}
        {shoppingCount > 0 && <span className="ml-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] text-zinc-950">{shoppingCount}</span>}
      </NavLink>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-emerald-600 focus:px-3 focus:py-2 focus:text-white">
        {t('common.skipToContent')}
      </a>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-800/80 bg-zinc-900/75 backdrop-blur">
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

          <nav className="hidden items-center gap-1 sm:flex sm:gap-2">{navigation}
            <LanguageSwitcher />
            <button type="button" onClick={() => setIsDark((value) => !value)} className="ml-1 rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300" aria-label={t('common.toggleTheme')}>
              {isDark ? '☀' : '☾'}
            </button>
          </nav>
          <button ref={menuButtonRef} type="button" className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-200 sm:hidden" aria-label={t('common.openMenu')} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen(true)}>
            ☰
          </button>
        </div>
      </header>

      {isMenuOpen && <button type="button" className="fixed inset-0 z-40 w-full bg-black/50 sm:hidden" aria-label={t('common.closeMenu')} onClick={() => setIsMenuOpen(false)} />}
      <aside ref={menuRef} className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[calc(100vw-1rem)] bg-zinc-900 p-5 shadow-xl transition-transform sm:hidden ${isMenuOpen ? 'visible translate-x-0' : 'invisible pointer-events-none translate-x-full'}`} aria-hidden={!isMenuOpen}>
        <div className="mb-8 flex items-center justify-between">
          <span className="font-semibold text-emerald-400">{t('app.title')}</span>
          <button type="button" onClick={() => setIsMenuOpen(false)} className="rounded-md px-2 py-1 text-xl text-zinc-300" aria-label={t('common.closeMenu')}>×</button>
        </div>
        <nav className="flex flex-col gap-2">{navigation}</nav>
        <div className="mt-6 flex items-center justify-between"><LanguageSwitcher /><button type="button" onClick={() => setIsDark((value) => !value)} className="rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300" aria-label={t('common.toggleTheme')}>{isDark ? '☀' : '☾'}</button></div>
      </aside>

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-24">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-900/40 py-6 text-center text-xs text-zinc-500">
        <p>{t('app.title')} &copy; {new Date().getFullYear()} &mdash; {t('footer')}</p>
      </footer>
    </div>
  );
};

