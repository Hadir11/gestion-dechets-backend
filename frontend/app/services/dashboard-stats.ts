import { authService } from './auth-service';

export interface DashboardStats {
  points: number | null;
  employes: number | null;
  tournees: number | null;
  alertes: number | null;
}

async function fetchArray(endpoint: string): Promise<unknown[] | null> {
  try {
    const result = await authService.authFetch<unknown>(endpoint);
    return Array.isArray(result) ? result : null;
  } catch {
    return null;
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [points, employes, tournees, alertes] = await Promise.all([
    fetchArray('/points'),
    fetchArray('/employes'),
    fetchArray('/tournees'),
    fetchArray('/alertes/urgentes'),
  ]);

  return {
    points: points?.length ?? null,
    employes: employes?.length ?? null,
    tournees: tournees?.length ?? null,
    alertes: alertes?.length ?? null,
  };
}