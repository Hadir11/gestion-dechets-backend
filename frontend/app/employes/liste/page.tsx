//  PAGE DE LISTE
'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard';
import { authService } from '../../services/auth-service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../services/api-base';

interface Employe {
  id: string;
  _id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  roleCode: string;
  zone?: { _id?: string; nom?: string } | null;
  username: string;
  matricule?: string;
  isActive: boolean;
  createdAt: string;
}

export default function EmployesPage() {
  const router = useRouter();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Rôles pour les filtres
  const roles = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'AGENT', label: 'Agent de collecte' },
    { value: 'CHEF-EQUIPE', label: 'Chef d\'équipe' },
    { value: 'AGENT_TRI', label: 'Agent de tri' },
    { value: 'TECHNICIEN', label: 'Technicien' },
    { value: 'ADMIN', label: 'Administrateur' }
  ];

  // Icônes par rôle
  const roleIcons: { [key: string]: string } = {
    AGENT: '🚚',
    'CHEF-EQUIPE': '👨‍💼',
    AGENT_TRI: '♻️',
    TECHNICIEN: '🔧',
    ADMIN: '👑'
  };

  // Couleurs par rôle
  const roleColors: { [key: string]: { bg: string, text: string } } = {
    AGENT: { bg: '#3b82f6', text: '#ffffff' },
    'CHEF-EQUIPE': { bg: '#8b5cf6', text: '#ffffff' },
    AGENT_TRI: { bg: '#10b981', text: '#ffffff' },
    TECHNICIEN: { bg: '#f59e0b', text: '#ffffff' },
    ADMIN: { bg: '#ef4444', text: '#ffffff' }
  };

  useEffect(() => {
    fetchEmployes();
  }, []);

  const fetchEmployes = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/employes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        authService.logout();
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setEmployes(Array.isArray(data) ? data.map((employe: any) => ({ ...employe, id: employe.id || employe._id, isActive: employe.isActive ?? employe.disponible ?? true, email: employe.email || '', telephone: employe.telephone || '' })).filter((employe: Employe) => Boolean(employe.id)) : []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des employés');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/employes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (response.ok) {
        // Rafraîchir la liste
        fetchEmployes();
        alert('Employé supprimé avec succès');
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const employe = employes.find((currentEmploye) => currentEmploye.id === id);
      if (!employe) {
        throw new Error('Employé introuvable dans la liste');
      }

      const response = await fetch(`${API_BASE_URL}/employes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom: employe.nom,
          prenom: employe.prenom,
          role: employe.role,
          roleCode: employe.roleCode,
          telephone: employe.telephone,
          email: employe.email,
          disponible: !currentStatus,
          zone: employe.zone ?? null,
        })
      });

      if (response.ok) {
        fetchEmployes();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Filtrer les employés
  const filteredEmployes = employes.filter(employe => {
    const matchesSearch = searchTerm === '' ||
      employe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employe.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employe.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employe.telephone.includes(searchTerm);

    const matchesRole = filterRole === 'all' || employe.roleCode === filterRole;

    return matchesSearch && matchesRole;
  });

  // Calculer les statistiques
  const totalEmployes = employes.length;
  const activeEmployes = employes.filter(e => e.isActive).length;

  return (
    <AuthGuard>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f0f9ff',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{
            marginBottom: '40px',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#1e3a8a',
                  margin: '0 0 8px 0'
                }}>
                  👥 Gestion des Employés
                </h1>
                <p style={{
                  color: '#4b5563',
                  margin: 0,
                  fontSize: '16px'
                }}>
                  Gérez l'ensemble du personnel municipal de collecte des déchets
                </p>
              </div>

              <Link href="/employes">
                <button style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}>
                  <span style={{ fontSize: '20px' }}>➕</span>
                  Nouvel Employé
                </button>
              </Link>
            </div>

            {/* Statistiques */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{
                backgroundColor: '#e0f2fe',
                padding: '16px',
                borderRadius: '12px',
                flex: 1
              }}>
                <div style={{ fontSize: '14px', color: '#0369a1', marginBottom: '4px' }}>Total Employés</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#075985' }}>{totalEmployes}</div>
              </div>

              <div style={{
                backgroundColor: '#dcfce7',
                padding: '16px',
                borderRadius: '12px',
                flex: 1
              }}>
                <div style={{ fontSize: '14px', color: '#166534', marginBottom: '4px' }}>Actifs</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>{activeEmployes}</div>
              </div>

              <div style={{
                backgroundColor: '#fef3c7',
                padding: '16px',
                borderRadius: '12px',
                flex: 1
              }}>
                <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>Inactifs</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#92400e' }}>{totalEmployes - activeEmployes}</div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  🔍 Rechercher un employé
                </label>
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  🎯 Filtrer par rôle
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tableau des employés */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            {loading ? (
              <div style={{
                padding: '60px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #e5e7eb',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Chargement des employés...
              </div>
            ) : error ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#fef2f2',
                color: '#991b1b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                <h3 style={{ margin: '0 0 10px 0' }}>Erreur</h3>
                <p>{error}</p>
                <button
                  onClick={fetchEmployes}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Réessayer
                </button>
              </div>
            ) : filteredEmployes.length === 0 ? (
              <div style={{
                padding: '60px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>👤</div>
                <h3 style={{ margin: '0 0 10px 0' }}>Aucun employé trouvé</h3>
                <p>Aucun employé ne correspond à vos critères de recherche.</p>
                {searchTerm || filterRole !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterRole('all');
                    }}
                    style={{
                      marginTop: '20px',
                      padding: '10px 20px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Réinitialiser les filtres
                  </button>
                ) : null}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#f9fafb',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <th style={{
                        padding: '20px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '14px'
                      }}>Employé</th>
                      <th style={{
                        padding: '20px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '14px'
                      }}>Rôle</th>
                      <th style={{
                        padding: '20px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '14px'
                      }}>Contact</th>
                      <th style={{
                        padding: '20px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '14px'
                      }}>Statut</th>
                      <th style={{
                        padding: '20px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '14px'
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployes.map((employe, index) => (
                      <tr
                        key={employe.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                          borderBottom: '1px solid #e5e7eb',
                          transition: 'background-color 0.2s'
                        }}

                      >
                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              backgroundColor: '#3b82f6',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '18px'
                            }}>
                              {employe.prenom.charAt(0)}{employe.nom.charAt(0)}
                            </div>
                            <div>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1f2937'
                              }}>
                                {employe.prenom} {employe.nom}
                              </div>
                              <div style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                marginTop: '2px'
                              }}>
                                @{employe.username}
                                {employe.matricule && (
                                  <span style={{ marginLeft: '8px', color: '#9ca3af' }}>
                                    • #{employe.matricule}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>
                              {roleIcons[employe.roleCode] || '👤'}
                            </span>
                            <span style={{
                              backgroundColor: roleColors[employe.roleCode]?.bg + '20' || '#e5e7eb',
                              color: roleColors[employe.roleCode]?.text || '#374151',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              {employe.role}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                            📧 {employe.email}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            📱 {employe.telephone}
                          </div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <button
                            onClick={() => handleToggleStatus(employe.id, employe.isActive)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: employe.isActive ? '#dcfce7' : '#fee2e2',
                              color: employe.isActive ? '#166534' : '#991b1b',
                              border: 'none',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: employe.isActive ? '#22c55e' : '#ef4444',
                              borderRadius: '50%'
                            }}></span>
                            {employe.isActive ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link href={`/employes/${employe.id}`}>
                              <button style={{
                                padding: '8px 12px',
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                👁️ Voir
                              </button>
                            </Link>

                            <Link href={`/employes/${employe.id}/modifier`}>
                              <button style={{
                                padding: '8px 12px',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                ✏️ Modifier
                              </button>
                            </Link>

                            <button
                              onClick={() => handleDelete(employe.id)}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>
              {filteredEmployes.length} employé{filteredEmployes.length !== 1 ? 's' : ''} affiché{filteredEmployes.length !== 1 ? 's' : ''}
              {searchTerm && ` pour la recherche "${searchTerm}"`}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              © {new Date().getFullYear()} - Système de Gestion des Déchets Municipaux
            </p>
          </div>
        </div>

        {/* Styles globaux */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

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

          a {
            text-decoration: none;
          }

          input, select {
            font-family: inherit;
          }

          input:focus, select:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
