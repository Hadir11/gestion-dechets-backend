// frontend/app/employes/page.tsx - VERSION FINALE
'use client';

import { useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import { authService } from '../services/auth-service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '../services/api-base';

export default function NewEmployePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    role: 'Agent de collecte',
    roleCode: 'AGENT',
    telephone: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    matricule: ''
  });

  // Types d'employés avec leurs rôles
  const roles = [
    {
      value: 'Agent de collecte',
      code: 'AGENT',
      description: 'Collecte les déchets sur le terrain',
      icon: '🚚'
    },
    {
      value: 'Chef d équipe',
      code: 'CHEF-EQUIPE',
      description: 'Gère les équipes et les tournées',
      icon: '👨‍💼'
    },
    {
      value: 'Agent de tri',
      code: 'AGENT_TRI',
      description: 'Gère le centre de tri et recyclage',
      icon: '♻️'
    },
    {
      value: 'Technicien maintenance',
      code: 'TECHNICIEN',
      description: 'Entretien des véhicules et équipements',
      icon: '🔧'
    },
    {
      value: 'Administrateur',
      code: 'ADMIN',
      description: 'Accès complet au système',
      icon: '👑'
    }
  ];



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-remplir roleCode basé sur role
    if (name === 'role') {
      const selectedRole = roles.find(r => r.value === value);
      if (selectedRole) {
        setFormData(prev => ({
          ...prev,
          roleCode: selectedRole.code
        }));
      }
    }
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!formData.prenom.trim()) {
      setError('Le prénom est requis');
      return false;
    }
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Le nom d\'utilisateur est requis');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return false;
    }
    if (!formData.telephone.trim()) {
      setError('Le téléphone est requis');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { confirmPassword, ...employeData } = formData;

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(employeData),
      });

      // Lire la réponse
      const responseText = await response.text();
      let responseData;

      if (responseText && responseText.trim().length > 0) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          // Si ce n'est pas du JSON valide
          throw new Error('Réponse invalide du serveur');
        }
      }

      if (!response.ok) {
        // Gestion des erreurs HTTP
        let errorMessage = `Erreur ${response.status}`;

        if (response.status === 403) {
          errorMessage = 'Accès interdit. Vous devez être administrateur.';
        } else if (response.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          authService.logout();
          setTimeout(() => router.push('/login'), 1000);
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        }

        throw new Error(errorMessage);
      }

      // SUCCÈS
      setSuccess('Employé créé avec succès !');

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        prenom: '',
        role: 'Agent de collecte',
        roleCode: 'AGENT',
        telephone: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',

        matricule: ''
      });

      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push('/employes');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'employé');
    } finally {
      setLoading(false);
    }

  };

  const selectedRole = roles.find(r => r.value === formData.role);

  return (

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f0f9ff',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Header avec navigation */}
          <div style={{
            marginBottom: '40px',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <Link href="/employes">
                <button style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}>
                  ← Retour à la liste
                </button>
              </Link>

              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#1e3a8a',
                  margin: '0 0 8px 0'
                }}>
                  👤 Ajouter un nouvel employé
                </h1>
                <p style={{
                  color: '#4b5563',
                  margin: 0,
                  fontSize: '16px'
                }}>
                  Remplissez le formulaire pour intégrer un nouveau membre à l'équipe municipale
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire en deux colonnes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px'
          }}>
            {/* Colonne gauche - Formulaire */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              {error && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Erreur</strong>
                    {error}
                  </div>
                </div>
              )}

              {success && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#d1fae5',
                  borderRadius: '12px',
                  border: '1px solid #a7f3d0',
                  color: '#065f46',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Succès !</strong>
                    {success}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Informations personnelles */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 20px 0',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #3b82f6'
                  }}>
                    📋 Informations personnelles
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Prénom *
                      </label>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '10px',
                          fontSize: '16px',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        placeholder="Ex: Mohamed"
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
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '10px',
                          fontSize: '16px',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        placeholder="Ex: Ben Ali"
                      />
                    </div>
                  </div>
                </div>

                {/* Rôle et affectation */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 20px 0',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #3b82f6'
                  }}>
                    🏢 Rôle et affectation
                  </h3>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Rôle *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '10px',
                        fontSize: '16px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.icon} {role.value}
                        </option>
                      ))}
                    </select>
                  </div>



                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Matricule (optionnel)
                    </label>
                    <input
                      type="text"
                      name="matricule"
                      value={formData.matricule}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '10px',
                        fontSize: '16px'
                      }}
                      placeholder="Ex: EMP2024001"
                    />
                  </div>
                </div>

                {/* Informations de contact */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 20px 0',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #3b82f6'
                  }}>
                    📞 Informations de contact
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '10px',
                          fontSize: '16px'
                        }}
                        placeholder="Ex: 0612345678"
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
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '10px',
                          fontSize: '16px'
                        }}
                        placeholder="Ex: employe@municipalite.tn"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Nom d'utilisateur *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '10px',
                        fontSize: '16px'
                      }}
                      placeholder="Ex: mbenali"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 20px 0',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #3b82f6'
                  }}>
                    🔐 Création du compte
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Mot de passe *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '10px',
                          fontSize: '16px'
                        }}
                        placeholder="Au moins 6 caractères"
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
                        Confirmer le mot de passe *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '10px',
                          fontSize: '16px'
                        }}
                        placeholder="Retapez le mot de passe"
                      />
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  paddingTop: '24px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <Link href="/employes" style={{ flex: 1 }}>
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      Annuler
                    </button>
                  </Link>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 2,
                      padding: '16px',
                      backgroundColor: loading ? '#93c5fd' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '16px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3b82f6')}
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '3px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '20px' }}>➕</span>
                        Créer l'employé
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Colonne droite - Aperçu */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: 'fit-content'
            }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#1e3a8a',
                margin: '0 0 24px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>👁️</span> Aperçu de l'employé
              </h3>

              {selectedRole && (
                <div style={{ marginBottom: '30px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '24px'
                    }}>
                      {formData.prenom.charAt(0) || '?'}{formData.nom.charAt(0) || '?'}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#1f2937'
                      }}>
                        {formData.prenom || 'Prénom'} {formData.nom || 'Nom'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '20px' }}>{selectedRole.icon}</span>
                        <span style={{
                          backgroundColor: `${selectedRole.code === 'ADMIN' ? '#3b82f6' :
                                         selectedRole.code === 'CHEF-EQUIPE' ? '#8b5cf6' :
                                         selectedRole.code === 'AGENT_TRI' ? '#10b981' :
                                         selectedRole.code === 'TECHNICIEN' ? '#f59e0b' : '#3b82f6'}20`,
                          color: selectedRole.code === 'ADMIN' ? '#3b82f6' :
                                 selectedRole.code === 'CHEF-EQUIPE' ? '#8b5cf6' :
                                 selectedRole.code === 'AGENT_TRI' ? '#10b981' :
                                 selectedRole.code === 'TECHNICIEN' ? '#f59e0b' : '#3b82f6',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          {formData.role || 'Rôle'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{
                    color: '#6b7280',
                    lineHeight: '1.6',
                    marginBottom: '20px'
                  }}>
                    {selectedRole.description}
                  </p>
                </div>
              )}

              {/* Détails */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 16px 0'
                }}>
                  Détails de l'employé
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Identifiant</div>
                    <div style={{ color: '#374151', fontWeight: '500' }}>
                      {formData.username || 'Non défini'}
                    </div>
                  </div>


                  <div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Contact</div>
                    <div style={{ color: '#374151' }}>
                      <div style={{ marginBottom: '4px' }}>📧 {formData.email || 'Non défini'}</div>
                      <div>📱 {formData.telephone || 'Non défini'}</div>
                    </div>
                  </div>

                  {formData.matricule && (
                    <div>
                      <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Matricule</div>
                      <div style={{
                        color: '#1f2937',
                        fontWeight: '500',
                        display: 'inline-block',
                        backgroundColor: '#f0f9ff',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontFamily: 'monospace'
                      }}>
                        #{formData.matricule}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                border: '1px solid #fde68a'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px', color: '#92400e' }}>💡</span>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#92400e',
                      marginBottom: '8px'
                    }}>
                      Informations importantes
                    </div>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '20px',
                      fontSize: '13px',
                      color: '#92400e',
                      lineHeight: '1.5'
                    }}>
                      <li>L'employé recevra un email avec ses identifiants</li>
                      <li>Le mot de passe doit être changé à la première connexion</li>
                      <li>Vérifiez que le nom d'utilisateur est unique</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
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
              Système de Gestion des Déchets Municipaux
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              © {new Date().getFullYear()} - Tous droits réservés
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
            background-color: #f0f9ff;
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

  );

}
