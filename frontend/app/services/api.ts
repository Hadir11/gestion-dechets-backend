import { authService } from './auth-service';

import { API_BASE_URL } from './api-base';

export interface WastePoint {
  _id: string;
  latitude: number;
  longitude: number;
  adresse: string;
  zone: {
    id: string;
    nom: string;
  } | null;
  niveauRemplissage: number;
  type: string;
  capaciteMax: number;
  etat: string;
}

/**
 * Charge les points depuis Spring Boot avec authentification
 */
export async function fetchWastePoints(): Promise<WastePoint[] | null> {
  try {

    if (!authService.isAuthenticated()) {
      console.error('❌ Non authentifié, redirection vers login');
      window.location.href = '/login';
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/points`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: authService.getAuthHeaders(),
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      authService.logout();
      window.location.href = '/login';
      return null;
    }

    if (!response.ok) {
      console.error(`❌ Spring Boot erreur ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('❌ Données invalides:', data);
      return null;
    }

    return data;

  } catch (error) {
    console.error('❌ Erreur:', error);
    return null;
  }
}

/**
 * Autres endpoints protégés
 */
export async function fetchEmployes() {
  return authService.authFetch('/employes');
}

export async function createEmploye(data: any) {
  return authService.authFetch('/employes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEmploye(id: string, data: any) {
  return authService.authFetch(`/employes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
// Ajoutez ces fonctions à la fin du fichier
export async function optimiserTournee(): Promise<{
  success: boolean;
  message: string;
  tournee: any;
  statistiques: any;
}> {
  return authService.authFetch('/tournees/optimiser', {
    method: 'POST',
  });
}

export async function getTournees(): Promise<any[]> {
  return authService.authFetch('/tournees');
}

export async function getTourneeById(id: string): Promise<any> {
  return authService.authFetch(`/tournees/${id}`);
}
export async function deleteEmploye(id: string) {
  return authService.authFetch(`/employes/${id}`, {
    method: 'DELETE',
  });

}
