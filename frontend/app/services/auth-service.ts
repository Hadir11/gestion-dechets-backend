import { API_BASE_URL } from './api-base';

// Types pour l'authentification
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  nom: string;
  prenom: string;
  role: string;
  roleCode: string;
  telephone: string;
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  roleCode?: string;
}

export interface User {
  username: string;
  role: string;
  roleCode?: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  token: string;
}

// Service d'authentification
class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  private expiryKey = 'auth_token_expiry';

  // Vérification environnement navigateur
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Login - Version optimisée
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await this.handleResponse<AuthResponse>(response);

    if (!data.token) {
      throw new Error('Token non reçu du serveur');
    }

    // Stockage des données
    this.setToken(data.token);
    this.setUser(data);

    return data;
  }

  // Register
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    return this.handleResponse<AuthResponse>(response);
  }

  // Logout
  logout(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.expiryKey);

    // Redirection vers la page de login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Vérifier si connecté
  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;

    const token = this.getToken();
    if (!token) return false;

    const expiry = localStorage.getItem(this.expiryKey);
    if (expiry && Date.now() > parseInt(expiry)) {
      this.logout();
      return false;
    }

    return true;
  }

  // Récupérer le token
  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.tokenKey);
  }

  // Récupérer l'utilisateur
  getUser(): User | null {
    if (!this.isBrowser()) return null;
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Erreur parsing user:', error);
      return null;
    }
  }

  // Récupérer le rôle
  getUserRole(): string | null {
    const user = this.getUser();
    return user?.roleCode ?? user?.role ?? null;
  }

  // Vérifier si connecté simplement
  isConnected(): boolean {
    return this.isAuthenticated();
  }

  // Stocker le token
  private setToken(token: string): void {
    if (!this.isBrowser()) return;

    localStorage.setItem(this.tokenKey, token);

    let expiryTime = Date.now() + 24 * 60 * 60 * 1000;
    try {
      const payload = token.split('.')[1];
      const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof claims.exp === 'number') expiryTime = claims.exp * 1000;
    } catch {
      // Le serveur reste l'autorité sur la validité du jeton.
    }
    localStorage.setItem(this.expiryKey, expiryTime.toString());
  }

  // Stocker l'utilisateur
  private setUser(data: AuthResponse): void {
    if (!this.isBrowser()) return;

    const user: User = {
      username: data.username,
      role: data.role,
      roleCode: data.roleCode,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      token: data.token,
    };

    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Headers d'authentification
  getAuthHeaders(includeToken: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeToken) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Headers publics
  getPublicHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  // Gestion des réponses
  private async handleResponse<T>(response: Response): Promise<T> {
    let data: any = null;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch (error) {
        console.error('Erreur parsing JSON:', error);
      }
    }

    if (!response.ok) {
      let message = 'Erreur lors de la requête';

      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else {
        message = `Erreur ${response.status}: ${response.statusText}`;
      }

      if (response.status === 401) {
        this.logout();
        message = 'Session expirée. Veuillez vous reconnecter.';
      }

      if (response.status === 403) {
        message = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      }

      throw new Error(message);
    }

    return data as T;
  }

  // Fetch avec authentification
  async authFetch<T>(
    url: string,
    options: RequestInit = {},
    includeToken: boolean = true
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...this.getAuthHeaders(includeToken),
        ...options.headers,
      },
    });

    return this.handleResponse<T>(response);
  }

  // Fetch publique
  async publicFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...this.getPublicHeaders(),
        ...options.headers,
      },
    });

    return this.handleResponse<T>(response);
  }

  // Nouvelle méthode : Vérifier et rafraîchir l'authentification
  checkAuth(): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }

    // Vérifier si le token est sur le point d'expirer (15 minutes)
    const expiry = localStorage.getItem(this.expiryKey);
    if (expiry) {
      const timeToExpiry = parseInt(expiry) - Date.now();
      if (timeToExpiry < 15 * 60 * 1000) {
        console.warn('Token proche de l\'expiration');
        // Ici, vous pourriez implémenter un refresh token
      }
    }

    return true;
  }

  // Méthodes publiques pour le stockage
  public saveToken(token: string): void {
    this.setToken(token);
  }

  public saveUser(userData: any): void {
    this.setUser(userData);
  }

  // ========== NOUVELLES MÉTHODES POUR LES PERMISSIONS ==========

  /**
   * Vérifie si l'utilisateur peut accéder à une route spécifique
   */
  canAccessRoute(route: string): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    const userRoleUpper = userRole.toUpperCase();

    // Définir les permissions par route
    const routePermissions: Record<string, string[]> = {
      // Routes communes (accessibles à tous)
      '/dashboard': ['ADMIN', 'CHEF_EQUIPE', 'AGENT', 'AGENT_COLLECTE'],
      '/map': ['ADMIN', 'CHEF_EQUIPE', 'AGENT', 'AGENT_COLLECTE'],
      '/profile': ['ADMIN', 'CHEF_EQUIPE', 'AGENT', 'AGENT_COLLECTE'],

      // Routes admin seulement
      '/admin/dashboard': ['ADMIN'],
      '/admin/employes': ['ADMIN'],
      '/admin/tournees': ['ADMIN'],
      '/admin/stats': ['ADMIN'],
      '/optimisation': ['ADMIN'],

      // Routes chef d'équipe (et admin)
      '/chef/equipe': ['CHEF_EQUIPE', 'ADMIN'],
      '/chef/planification': ['CHEF_EQUIPE', 'ADMIN'],
      '/chef/tournees': ['CHEF_EQUIPE', 'ADMIN'],

      // Routes agent (accessibles aussi aux chefs pour supervision)
      '/agent/missions': ['AGENT', 'AGENT_COLLECTE', 'CHEF_EQUIPE', 'ADMIN'],
      '/agent/incidents': ['AGENT', 'AGENT_COLLECTE', 'CHEF_EQUIPE', 'ADMIN'],
      '/agent/statut': ['AGENT', 'AGENT_COLLECTE', 'CHEF_EQUIPE', 'ADMIN'],

      // Routes login/public
      '/login': ['ADMIN', 'CHEF_EQUIPE', 'AGENT', 'AGENT_COLLECTE'],
      '/register': ['ADMIN'],
      '/forgot-password': ['ADMIN', 'CHEF_EQUIPE', 'AGENT', 'AGENT_COLLECTE'],
    };

    // Chercher la route exacte d'abord
    const allowedRoles = routePermissions[route] || [];

    // Si la route exacte n'est pas trouvée, chercher les sous-routes
    if (allowedRoles.length === 0) {
      // Parcourir toutes les routes définies
      for (const [routePattern, roles] of Object.entries(routePermissions)) {
        // Vérifier si la route actuelle commence par le pattern
        // Ex: /agent/missions/123 correspond à /agent/missions
        if (route.startsWith(routePattern + '/') || route === routePattern) {
          return roles.map(r => r.toUpperCase()).includes(userRoleUpper);
        }
      }

      // Route non définie - par défaut, refuser l'accès
      return false;
    }

    return allowedRoles.map(r => r.toUpperCase()).includes(userRoleUpper);
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(requiredRole: string | string[]): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    const userRoleUpper = userRole.toUpperCase();
    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole.map(r => r.toUpperCase())
      : [requiredRole.toUpperCase()];

    return requiredRoles.includes(userRoleUpper);
  }

  /**
   * Retourne la page par défaut pour le rôle de l'utilisateur
   */
getDefaultRoute(): string {
  const userRole = this.getUserRole();
  if (!userRole) {
    console.log('getDefaultRoute: Pas de rôle utilisateur');
    return '/login';
  }

  console.log('getDefaultRoute: Rôle détecté =', userRole);
  const userRoleUpper = userRole.toUpperCase();
  console.log('getDefaultRoute: Rôle en majuscules =', userRoleUpper);

  switch(userRoleUpper) {
    case 'ADMIN':
    case 'ADMINISTRATEUR':
      console.log('getDefaultRoute: Redirection vers /admin/dashboard');
      return '/admin/dashboard';

    case 'CHEF_EQUIPE':
    case 'CHEF-EQUIPE':
      console.log('getDefaultRoute: Redirection vers /chef/equipe');
      return '/chef/equipe';

    case 'AGENT':
    case 'AGENT_COLLECTE':
      console.log('getDefaultRoute: Redirection vers /agent/missions');
      return '/agent/missions';

    case 'TECH':
    case 'TECHNICIEN':
    case 'RESPONSABLE_RECYCLAGE':
    case 'AGENT_TRI':
      return '/dashboard';

    default:
      console.log('getDefaultRoute: Rôle non reconnu, redirection vers /dashboard');
      return '/dashboard';
  }

  }

  /**
   * Vérifie les permissions de navigation
   */
  getNavigationItems(): Array<{label: string, href: string, icon: string}> {
    const userRole = this.getUserRole();
    if (!userRole) return [];

    const userRoleUpper = userRole.toUpperCase();

    // Items communs à tous les rôles
    const commonItems = [
      { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
      { label: 'Carte', href: '/map', icon: '🗺️' },
      { label: 'Mon Profil', href: '/profile', icon: '👤' },
    ];

    // Items spécifiques selon le rôle
    let roleSpecificItems: Array<{label: string, href: string, icon: string}> = [];

    if (userRoleUpper.includes('ADMIN')) {
      roleSpecificItems = [
        { label: 'Admin Dashboard', href: '/admin/dashboard', icon: '👑' },
        { label: 'Employés', href: '/admin/employes', icon: '👥' },
        { label: 'Tournées', href: '/admin/tournees', icon: '📋' },
        { label: 'Statistiques', href: '/admin/stats', icon: '📊' },
        { label: 'Supervision', href: '/chef/equipe', icon: '👁️' },
      ];
    } else if (userRoleUpper.includes('CHEF_EQUIPE') || userRoleUpper.includes('CHEF-EQUIPE')) {
      roleSpecificItems = [
        { label: 'Mon Équipe', href: '/chef/equipe', icon: '👨‍💼' },
        { label: 'Planification', href: '/chef/planification', icon: '📅' },
        { label: 'Supervision', href: '/agent/missions', icon: '👁️' },
      ];
    } else if (userRoleUpper.includes('AGENT')) {
      roleSpecificItems = [
        { label: 'Mes Missions', href: '/agent/missions', icon: '✅' },
        { label: 'Incidents', href: '/agent/incidents', icon: '⚠️' },
        { label: 'Statut', href: '/agent/statut', icon: '📝' },
      ];
    }

    return [...commonItems, ...roleSpecificItems];
  }

  /**
   * Nettoie les données utilisateur sensibles
   */
  clearSensitiveData(): void {
    if (!this.isBrowser()) return;

    // Supprimer les données sensibles mais garder l'authentification
    const user = this.getUser();
    if (user) {
      // Créer une copie sans données sensibles
      const safeUser = {
        username: user.username,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
        token: user.token,
      };

      localStorage.setItem(this.userKey, JSON.stringify(safeUser));
    }
  }

  /**
   * Rafraîchit le token (à implémenter si backend supporte refresh tokens)
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          this.setToken(data.token);
          return true;
        }
      }
    } catch (error) {
      console.error('Erreur rafraîchissement token:', error);
    }

    return false;
  }
}

export const authService = new AuthService();
