'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth-service';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🗑️ Gestion Municipale des Déchets
              </h1>
              <nav className="ml-10 flex space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Dashboard
                </Link>
                <Link href="/map" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Carte
                </Link>
                <Link href="/employes" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Employés
                </Link>
                <Link href="/tournees" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Tournées
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user.prenom} {user.nom}</span>
                  <span className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                    {user.role}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            Système de gestion des déchets © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}