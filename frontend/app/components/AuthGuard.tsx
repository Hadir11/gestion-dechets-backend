'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth-service';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Ces appels se font UNIQUEMENT dans le navigateur
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      if (requiredRole) {
        const userRole = authService.getUserRole();
        if (userRole !== requiredRole) {
          router.replace(authService.getDefaultRoute());
          return;
        }
      }

      setIsAuthorized(true);
    };

    checkAuth();
    setIsChecking(false);
  }, [router, requiredRole]);

  // Pendant le chargement initial (côté client uniquement)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Si non autorisé (après vérif côté client)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirection en cours...</p>
      </div>
    );
  }

  return <>{children}</>;
}