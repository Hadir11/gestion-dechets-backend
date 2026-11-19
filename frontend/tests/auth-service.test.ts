import { describe, expect, it, beforeEach } from 'vitest';
import { authService } from '../app/services/auth-service';

/**
 * La redirection après connexion dépend du libellé du rôle renvoyé par l'API.
 * Ces libellés ont changé plusieurs fois (ADMIN, Administrateur, CHEF-EQUIPE…),
 * et une erreur ici envoie l'utilisateur sur une page qui n'est pas la sienne.
 */
describe('redirection selon le rôle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function connecteAvecRole(role: string) {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ username: 'test', role, token: 'jeton' })
    );
  }

  it('envoie un administrateur sur son tableau de bord', () => {
    connecteAvecRole('ADMIN');
    expect(authService.getDefaultRoute()).toBe('/admin/dashboard');
  });

  it('accepte le libellé complet renvoyé par l’API', () => {
    connecteAvecRole('Administrateur');
    expect(authService.getDefaultRoute()).toBe('/admin/dashboard');
  });

  it('envoie un chef d’équipe sur son équipe', () => {
    connecteAvecRole('CHEF_EQUIPE');
    expect(authService.getDefaultRoute()).toBe('/chef/equipe');
  });

  it('envoie un agent sur ses missions', () => {
    connecteAvecRole('AGENT');
    expect(authService.getDefaultRoute()).toBe('/agent/missions');
  });

  it('ramène sur le login quand aucun utilisateur n’est stocké', () => {
    expect(authService.getDefaultRoute()).toBe('/login');
  });
});
