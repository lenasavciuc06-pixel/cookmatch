import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { favoritesSelectors, shoppingListSelectors, useFavoritesStore, useShoppingListStore } from '@/store';

export const Layout: React.FC = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('cookmatch-theme') === 'dark'; } catch { return false; }
  });
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const favoriteCount = useFavoritesStore(favoritesSelectors.slugs).size;
  const shoppingCount = useShoppingListStore(shoppingListSelectors.items).length;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    try { localStorage.setItem('cookmatch-theme', isDark ? 'dark' : 'light'); } catch { /* Theme still works without storage. */ }
  }, [isDark]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      menuButtonRef.current?.focus();
      return;
    }

    menuRef.current?.querySelector<HTMLAnchorElement>('nav a')?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
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
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = previousOverflow; };
  }, [isMenuOpen]);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'nav-active bg-sage text-text-primary'
        : 'hover:bg-sage/20'
    }`;

  const navigation = (
    <>
      <NavLink to="/" className={navItemClass} end>
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
        {favoriteCount > 0 && <span className="nav-badge ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-on-accent">{favoriteCount}</span>}
      </NavLink>
      <NavLink to="/shopping-list" className={navItemClass}>
        {t('nav.shoppingList')}
        {shoppingCount > 0 && <span className="nav-badge ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-on-accent">{shoppingCount}</span>}
      </NavLink>
    </>
  );

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-forest focus:px-3 focus:py-2 focus:text-white">
        {t('common.skipToContent')}
      </a>
      <header className="site-header sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <NavLink to="/" aria-label={t('app.title')} className="inline-flex min-h-11 items-center gap-3">
            <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none" aria-hidden="true">
              <path d="M7 24h26c-1 8-6 12-13 12S8 32 7 24Z" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M20 22c-8-1-11-6-10-14 8 0 13 5 10 14Zm1-6c1-7 5-10 12-10 0 8-4 12-12 12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
            <span className="font-serif text-2xl tracking-tight">{t('app.title')}</span>
          </NavLink>

          <nav className="hidden items-center gap-1 xl:flex">{navigation}
            <LanguageSwitcher />
            <button type="button" onClick={() => setIsDark((value) => !value)} className="ml-1 rounded-md border border-border px-2 py-1.5 text-xs text-text-secondary" aria-label={t('common.toggleTheme')}>
              {isDark ? '☀' : '☾'}
            </button>
          </nav>
          <button ref={menuButtonRef} type="button" className="rounded-md border border-border px-3 py-2 text-text-primary xl:hidden" aria-label={t('common.openMenu')} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen(true)}>
            ☰
          </button>
        </div>
      </header>

      {isMenuOpen && <button type="button" className="fixed inset-0 z-40 w-full bg-black/50 xl:hidden" aria-label={t('common.closeMenu')} onClick={() => setIsMenuOpen(false)} />}
      <aside ref={menuRef} className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[calc(100vw-1rem)] overflow-y-auto bg-surface p-5 shadow-xl transition-transform xl:hidden ${isMenuOpen ? 'visible translate-x-0' : 'invisible pointer-events-none translate-x-full'}`} aria-hidden={!isMenuOpen}>
        <div className="mb-8 flex items-center justify-between">
          <span className="font-semibold text-accent">{t('app.title')}</span>
          <button type="button" onClick={() => setIsMenuOpen(false)} className="rounded-md px-2 py-1 text-xl text-text-secondary" aria-label={t('common.closeMenu')}>×</button>
        </div>
        <nav className="flex flex-col gap-2">{navigation}</nav>
        <div className="mt-6 flex items-center justify-between"><LanguageSwitcher /><button type="button" onClick={() => setIsDark((value) => !value)} className="rounded-md border border-border px-2 py-1.5 text-xs text-text-secondary" aria-label={t('common.toggleTheme')}>{isDark ? '☀' : '☾'}</button></div>
      </aside>

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8 sm:pt-12">
        <Outlet />
      </main>

      <footer className="mt-8 border-t border-border py-8 text-center text-xs text-text-muted">
        <p>{t('app.title')} &copy; {new Date().getFullYear()} &mdash; {t('footer')}</p>
      </footer>
    </div>
  );
};

