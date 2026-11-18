'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '../services/auth-service';
import Link from 'next/link';

interface RoleBasedLayoutProps { children: ReactNode; }
interface NavItem { label: string; href: string; icon: string; }

export default function RoleBasedLayout({ children }: RoleBasedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) { router.replace('/login'); return; }
    setUser(currentUser);
    setLoading(false);
  }, [router, pathname]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  const getNavItems = (): NavItem[] => {
    const role = String(user?.role || '').toUpperCase();
    const common: NavItem[] = [
      { label: 'Vue générale', href: '/dashboard', icon: '⌂' },
      { label: 'Carte', href: '/map', icon: '⌖' },
    ];
    if (role.includes('ADMIN')) return [...common,
      { label: 'Employés', href: '/employes/liste', icon: '♙' },
      { label: 'Tournées', href: '/tournees', icon: '▤' },
      { label: 'Alertes', href: '/alertes', icon: '!' },
    ];
    if (role.includes('CHEF')) return [...common,
      { label: 'Mon équipe', href: '/chef/equipe', icon: '♧' },
      { label: 'Optimisation', href: '/optimisation', icon: '↗' },
      { label: 'Alertes', href: '/chef/alertes', icon: '!' },
    ];
    if (role.includes('AGENT')) return [...common,
      { label: 'Mes missions', href: '/agent/missions', icon: '✓' },
    ];
    return common;
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 px-4"><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /><span className="text-sm font-medium text-slate-600">Chargement de votre espace…</span></div></div>;
  if (!user) return null;

  const renderNav = (mobile = false) => getNavItems().map((item) => {
    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
    return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
      className={(mobile ? 'flex items-center gap-3 rounded-xl px-3 py-2.5 ' : 'inline-flex items-center gap-2 rounded-xl px-3 py-2 ') + 'text-sm font-semibold transition ' + (active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
      <span aria-hidden="true">{item.icon}</span>{item.label}
    </Link>;
  });

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-screen-2xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white">É</span>
          <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-950 sm:text-base">ÉcoCollecte</span><span className="hidden text-xs text-slate-500 sm:block">Gestion municipale des déchets</span></span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">{renderNav()}</nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block"><p className="max-w-40 truncate text-sm font-semibold text-slate-800">{user.prenom} {user.nom}</p><p className="text-xs text-slate-500">{user.role}</p></div>
          <button type="button" onClick={handleLogout} className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:inline-flex">Déconnexion</button>
          <button type="button" aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-lg text-slate-700 hover:bg-slate-50 lg:hidden">{menuOpen ? '×' : '☰'}</button>
        </div>
        {menuOpen && <nav aria-label="Navigation mobile" className="w-full border-t border-slate-100 pt-3 lg:hidden"><div className="grid gap-1 sm:grid-cols-2">{renderNav(true)}<button type="button" onClick={handleLogout} className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50 sm:hidden">Déconnexion</button></div></nav>}
      </div>
    </header>
    <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
  </div>;
}
