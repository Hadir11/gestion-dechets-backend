'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import { authService } from '../services/auth-service';
import { fetchDashboardStats, type DashboardStats } from '../services/dashboard-stats';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({ points: 0, employes: 0, tournees: 0, alertes: 0 });

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    void fetchDashboardStats().then(setStats);
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '40px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 8px 0'
              }}>
                Bienvenue, <span style={{ color: '#3b82f6' }}>{user?.prenom} 👋</span>
              </h1>
              <p style={{
                color: '#6b7280',
                fontSize: '16px',
                margin: 0
              }}>
                Voici votre tableau de bord de gestion des déchets
              </p>
            </div>

            {/* User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '12px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '500', color: '#111827' }}>
                    {user?.prenom} {user?.nom}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    backgroundColor: '#f3f4f6',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    marginTop: '4px'
                  }}>
                    {user?.role}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Stats Grid - Version simple */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {[
              { title: 'Points de Collecte', value: String(stats.points ?? '—'), icon: '🗺️', color: '#3b82f6', link: '/map' },
              { title: 'Employés', value: String(stats.employes ?? '—'), icon: '👥', color: '#10b981', link: '/employes' },
              { title: 'Tournées', value: String(stats.tournees ?? '—'), icon: '🚚', color: '#f59e0b', link: '/tournees' },
              { title: 'Alertes Actives', value: String(stats.alertes ?? '—'), icon: '🚨', color: '#ef4444', link: '/alertes' },
            ].map((stat, index) => (
              <Link key={index} href={stat.link} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: `${stat.color}20`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '24px', color: stat.color }}>{stat.icon}</span>
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#111827',
                        margin: '0 0 4px 0'
                      }}>
                        {stat.value}
                      </h3>
                      <p style={{ color: '#6b7280', margin: 0 }}>
                        {stat.title}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    color: stat.color,
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Voir détails
                    <span style={{ marginLeft: '8px', fontSize: '18px' }}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions - Version simple */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '40px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 24px 0'
            }}>
              Actions Rapides
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {[
                { title: 'Voir la Carte', desc: 'Explorer les points de collecte', icon: '📍', color: '#3b82f6', onClick: () => router.push('/map') },
                { title: 'Nouvelle Tournée', desc: 'Planifier une collecte', icon: '📅', color: '#10b981', onClick: () => router.push('/optimisation') },
                { title: 'Liste des employes', desc: 'Afficher liste des employés', icon: '👤', color: '#8b5cf6', onClick: () => router.push('/employes/liste') },
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = action.color;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${action.color}20`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: `${action.color}20`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '20px', color: action.color }}>{action.icon}</span>
                    </div>
                    <div>
                      <h4 style={{
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 4px 0',
                        fontSize: '16px'
                      }}>
                        {action.title}
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        {action.desc}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {/* Carte Interactive - Lien vers votre page /map */}
            <Link href="/map" style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: '#10b981',
                borderRadius: '12px',
                padding: '24px',
                color: 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '32px' }}>🗺️</span>
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)'
                  }}>
                    Carte Interactive
                  </span>
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0'
                }}>
                  Explorer la Carte
                </h3>
                <p style={{
                  opacity: 0.95,
                  margin: '0 0 20px 0',
                  lineHeight: '1.5'
                }}>
                  Visualisez tous les points de collecte en temps réel avec leur niveau de remplissage
                </p>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontWeight: '600',
                    fontSize: '15px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '8px'
                  }}>
                    Accéder à la carte
                    <span style={{ marginLeft: '8px', fontSize: '20px' }}>→</span>
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/employes" style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: '#8b5cf6',
                borderRadius: '12px',
                padding: '24px',
                color: 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '32px' }}>👥</span>
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)'
                  }}>
                    Gestion Équipe
                  </span>
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0'
                }}>
                  Gérer les Employés
                </h3>
                <p style={{
                  opacity: 0.95,
                  margin: '0 0 20px 0',
                  lineHeight: '1.5'
                }}>
                  Consultez et gérez votre équipe, attribuez des rôles et suivez les performances
                </p>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontWeight: '600',
                    fontSize: '15px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '8px'
                  }}>
                    Voir l'équipe
                    <span style={{ marginLeft: '8px', fontSize: '20px' }}>→</span>
                  </span>
                </div>
              </div>
            </Link>

<Link href="/optimisation" style={{ textDecoration: 'none' }}>
  <div style={{
    backgroundColor: '#8b5cf6',
    borderRadius: '12px',
    padding: '24px',
    color: 'white',
    transition: 'all 0.3s ease'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-5px)';
    e.currentTarget.style.boxShadow = '0 10px 25px rgba(139, 92, 246, 0.3)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px'
    }}>
      <span style={{ fontSize: '32px' }}>🚀</span>
      <span style={{
        backgroundColor: 'rgba(255,255,255,0.3)',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        backdropFilter: 'blur(10px)'
      }}>
        Optimisation IA
      </span>
    </div>
    <h3 style={{
      fontSize: '20px',
      fontWeight: 'bold',
      margin: '0 0 8px 0'
    }}>
      Optimiser les Tournées
    </h3>
    <p style={{
      opacity: 0.95,
      margin: '0 0 20px 0',
      lineHeight: '1.5'
    }}>
      Utilisez l'algorithme Dijkstra pour générer des tournées optimales
    </p>
    <div style={{ textAlign: 'right' }}>
      <span style={{
        fontWeight: '600',
        fontSize: '15px',
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '6px 12px',
        borderRadius: '8px'
      }}>
        Lancer l'optimisation
        <span style={{ marginLeft: '8px', fontSize: '20px' }}>→</span>
      </span>
    </div>
  </div>
</Link>
            <Link href="/tournees" style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: '#f59e0b',
                borderRadius: '12px',
                padding: '24px',
                color: 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '32px' }}>🚚</span>
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)'
                  }}>
                    Planification
                  </span>
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0'
                }}>
                  Tournées de Collecte
                </h3>
                <p style={{
                  opacity: 0.95,
                  margin: '0 0 20px 0',
                  lineHeight: '1.5'
                }}>
                  Planifiez et suivez les tournées de collecte optimisées par l'IA
                </p>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontWeight: '600',
                    fontSize: '15px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '8px'
                  }}>
                    Planifier une tournée
                    <span style={{ marginLeft: '8px', fontSize: '20px' }}>→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Footer */}
          <div style={{
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ color: '#6b7280', fontWeight: '500' }}>
                Système de Gestion des Déchets Municipaux
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                © {new Date().getFullYear()} - Tous droits réservés
              </div>
            </div>
          </div>
        </div>

        {/* Global Styles */}
        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, sans-serif;
          }

          button {
            font-family: inherit;
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}