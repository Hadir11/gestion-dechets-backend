'use client';

import RoleBasedLayout from '../../components/RoleBasedLayout';
import { authService } from '../../services/auth-service';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../services/api-base';

interface Alerte {
  _id: string;
  pointCollecte?: {
    _id: string;
    nom: string;
    adresse: string;
  };
  dateAlerte: string;
  typeAlerte: string;
  niveauRemplissage: number;
  message: string;
  traitee: boolean;
}

export default function AlertesPage() {
  const router = useRouter();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [equipe, setEquipe] = useState('');

  const [equipes, setEquipes] = useState<any[]>([]);

  useEffect(() => {
    void fetchAlertes();
    void fetchEquipes();
  }, []);

  const fetchAlertes = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/alertes/urgentes`, {
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
      const liste = Array.isArray(data) ? data : [];
      setAlertes(liste);
      setSelectedAlerte((current) => liste.find((item) => item._id === current?._id) || liste[0] || null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des alertes');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/equipes`, { headers: authService.getAuthHeaders() });
      if (!response.ok) throw new Error('Impossible de charger les équipes.');
      const data = await response.json();
      setEquipes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement équipes:', err);
      setEquipes([]);
    }
  };

  const traiterAlerte = async (id: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/alertes/${id}/traiter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchAlertes();
        setSelectedAlerte(null);
        alert('✅ Alerte marquée comme traitée');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors du traitement de l\'alerte');
    }
  };

  const escaladerAlerte = async (id: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/alertes/${id}/escalader`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchAlertes();
        alert('📤 Alerte escaladée avec succès');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors de l\'escalade de l\'alerte');
    }
  };

  const ignorerAlerte = async (id: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/alertes/${id}/ignorer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchAlertes();
        setSelectedAlerte(null);
        alert('🚫 Alerte ignorée');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors de l\'ignorance de l\'alerte');
    }
  };

  const assignerEquipe = async (id: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/alertes/${id}/assigner-equipe?equipe=${encodeURIComponent(equipe)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchAlertes();
        setShowAssignModal(false);
        setEquipe('');
        alert(`👷 Équipe ${equipe} assignée avec succès`);
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors de l\'assignation de l\'équipe');
    }
  };

  const envoyerInstruction = async (id: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/alertes/${id}/envoyer-instruction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(instruction)
      });

      if (response.ok) {
        fetchAlertes();
        setShowInstructionModal(false);
        setInstruction('');
        alert('📩 Instruction envoyée avec succès');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors de l\'envoi de l\'instruction');
    }
  };

  const replanifierTournee = async (id: string) => {
    const nouvelleDate = prompt('Entrez la nouvelle date (JJ/MM/AAAA HH:MM):',
      new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}));

    if (nouvelleDate) {
      try {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/alertes/${id}/replanifier-tournee?nouvelleDate=${encodeURIComponent(nouvelleDate)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          fetchAlertes();
          alert('🔄 Tournée replanifiée avec succès');
        }
      } catch (err) {
        console.error('Erreur:', err);
        alert('❌ Erreur lors de la replanification');
      }
    }
  };

  // Icônes et couleurs par type d'alerte
  const getAlerteIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Véhicule en panne': '🚚',
      'Point inaccessible': '📍',
      'Déchets dangereux': '☣️',
      'Conteneur endommagé': '⚠️',
      'Route bloquée': '🚧',
      'Autre problème': '❓',
      'Conteneur rempli à 100%': '🚨',
      'Aucun employé disponible': '👤',
      'Surcharge zone': '📊',
    };
    return icons[type] || '🚨';
  };

  const getAlerteColor = (type: string) => {
    const colors: Record<string, string> = {
      'Véhicule en panne': '#ef4444',
      'Point inaccessible': '#f59e0b',
      'Déchets dangereux': '#dc2626',
      'Conteneur endommagé': '#f59e0b',
      'Route bloquée': '#8b5cf6',
      'Autre problème': '#6b7280',
      'Conteneur rempli à 100%': '#ef4444',
      'Aucun employé disponible': '#3b82f6',
      'Surcharge zone': '#10b981',
    };
    return colors[type] || '#6b7280';
  };

  // L’API ne renvoie que les alertes actives, déjà non traitées.
  const stats = {
    total: alertes.length,
    urgentes: alertes.filter((a) => /100%|endomm|panne|danger|surcharge/i.test(a.typeAlerte || '')).length,
    sites: new Set(alertes.map((a) => a.pointCollecte?._id || a.pointCollecte?.adresse).filter(Boolean)).size,
  };

  return (
    <RoleBasedLayout>
      <div className="alertes-container">
        {/* Background effects */}
        <div className="background-circle top-right"></div>
        <div className="background-circle bottom-left"></div>

        <div className="main-content">
          {/* Header */}
          <div className="page-header">
            <div className="header-left">
              <h1 className="page-title">🚨 Alertes Signalées</h1>
              <p className="page-subtitle">
                Gérez les alertes signalées par vos agents
              </p>
            </div>

            <div className="header-right">
              <button onClick={fetchAlertes} className="refresh-btn">
                <span className="refresh-icon">🔄</span>
                Actualiser
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {[
              { label: 'Alertes actives', value: stats.total, color: 'blue', icon: '📊' },
              { label: 'Sites concernés', value: stats.sites, color: 'green', icon: '📍' },
              { label: 'Critiques', value: stats.urgentes, color: 'red', icon: '🚨' },
            ].map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-content">
                  <div className="stat-numbers">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                  <div className={`stat-icon-wrapper ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-alert">
              <div className="error-alert-content">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{error}</span>
                <button onClick={fetchAlertes} className="retry-btn">
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement des alertes...</p>
            </div>
          ) : alertes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>Aucune alerte signalée</h3>
              <p>Toutes les alertes sont traitées. Bon travail !</p>
            </div>
          ) : (
            <div className="alertes-grid">
              {/* Liste des alertes */}
              <div className="alertes-list-section">
                <div className="section-header">
                  <h2>📋 Alertes en Attente</h2>
                  <p className="section-subtitle">
                    {stats.total} alerte{stats.total > 1 ? 's' : ''} nécessitant une attention
                  </p>
                </div>

                <div className="alertes-list">
                  {alertes.map((alerte) => (
                    <div
                      key={alerte._id}
                      className={`alerte-item ${selectedAlerte?._id === alerte._id ? 'selected' : ''} ${alerte.traitee ? 'traitee' : ''}`}
                      onClick={() => setSelectedAlerte(alerte)}
                    >
                      <div className="alerte-header">
                        <div className="alerte-icon" style={{ color: getAlerteColor(alerte.typeAlerte) }}>
                          {getAlerteIcon(alerte.typeAlerte)}
                        </div>
                        <div className="alerte-title">
                          <h3>{alerte.typeAlerte}</h3>
                          <div className="alerte-meta">
                            {alerte.pointCollecte && (
                              <span className="point-nom">
                                📍 {alerte.pointCollecte.nom}
                              </span>
                            )}
                            <span className="alerte-date">
                              📅 {new Date(alerte.dateAlerte).toLocaleString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <div className={`alerte-status ${alerte.traitee ? 'status-traitee' : 'status-urgence'}`}>
                          {alerte.traitee ? '✅ Traitée' : '🚨 Urgent'}
                        </div>
                      </div>

                      <div className="alerte-content">
                        <p className="alerte-message">{alerte.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails et actions */}
              <div className="actions-section">
                {selectedAlerte ? (
                  <div className="alerte-details-card">
                    <div className="card-header">
                      <h2>🎯 Détails de l'Alerte</h2>
                    </div>

                    <div className="details-content">
                      <div className="alerte-info">
                        <div className="info-item">
                          <span className="info-label">Type:</span>
                          <span className="info-value" style={{ color: getAlerteColor(selectedAlerte.typeAlerte) }}>
                            {getAlerteIcon(selectedAlerte.typeAlerte)} {selectedAlerte.typeAlerte}
                          </span>
                        </div>

                        {selectedAlerte.pointCollecte && (
                          <>
                            <div className="info-item">
                              <span className="info-label">Point de collecte:</span>
                              <span className="info-value">
                                📍 {selectedAlerte.pointCollecte.nom}
                              </span>
                            </div>

                            <div className="info-item">
                              <span className="info-label">Adresse:</span>
                              <span className="info-value">
                                🏠 {selectedAlerte.pointCollecte.adresse}
                              </span>
                            </div>
                          </>
                        )}

                        <div className="info-item">
                          <span className="info-label">Date:</span>
                          <span className="info-value">
                            📅 {new Date(selectedAlerte.dateAlerte).toLocaleString('fr-FR')}
                          </span>
                        </div>

                        <div className="info-item">
                          <span className="info-label">Statut:</span>
                          <span className={`info-value ${selectedAlerte.traitee ? 'status-traitee' : 'status-urgence'}`}>
                            {selectedAlerte.traitee ? '✅ Traitée' : '🚨 En attente'}
                          </span>
                        </div>
                      </div>

                      <div className="message-section">
                        <h3>📝 Message:</h3>
                        <p className="message-content">{selectedAlerte.message}</p>
                      </div>

                      {/* Actions rapides */}
                      <div className="quick-actions">
                        <h3>⚡ Actions Rapides</h3>
                        <div className="actions-grid">
                          <button
                            onClick={() => traiterAlerte(selectedAlerte._id)}
                            className="action-btn green"
                            disabled={selectedAlerte.traitee}
                          >
                            <span>✅</span>
                            <span>Marquer comme traité</span>
                          </button>

                          <button
                            onClick={() => escaladerAlerte(selectedAlerte._id)}
                            className="action-btn orange"
                            disabled={selectedAlerte.traitee}
                          >
                            <span>⬆️</span>
                            <span>Escalader</span>
                          </button>

                          <button
                            onClick={() => setShowAssignModal(true)}
                            className="action-btn blue"
                            disabled={selectedAlerte.traitee}
                          >
                            <span>👷</span>
                            <span>Assigner équipe</span>
                          </button>

                          <button
                            onClick={() => setShowInstructionModal(true)}
                            className="action-btn purple"
                            disabled={selectedAlerte.traitee}
                          >
                            <span>📩</span>
                            <span>Envoyer instruction</span>
                          </button>

                          <button
                            onClick={() => replanifierTournee(selectedAlerte._id)}
                            className="action-btn yellow"
                            disabled={selectedAlerte.traitee}
                          >
                            <span>🔄</span>
                            <span>Replanifier tournée</span>
                          </button>

                          <button
                            onClick={() => ignorerAlerte(selectedAlerte._id)}
                            className="action-btn gray"
                            disabled={selectedAlerte.traitee}
                          >
                            <span>❌</span>
                            <span>Ignorer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="selection-prompt">
                    <div className="prompt-icon">👆</div>
                    <h3>Sélectionnez une alerte</h3>
                    <p>Cliquez sur une alerte dans la liste pour voir les détails et les actions disponibles</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showInstructionModal && selectedAlerte && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>📩 Envoyer une instruction</h2>
                <button onClick={() => setShowInstructionModal(false)} className="close-btn">
                  ×
                </button>
              </div>
              <div className="modal-body">
                <textarea
                  className="instruction-textarea"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Entrez l'instruction à envoyer..."
                  rows={4}
                />
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowInstructionModal(false)} className="cancel-btn">
                  Annuler
                </button>
                <button onClick={() => envoyerInstruction(selectedAlerte._id)} className="confirm-btn">
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}

        {showAssignModal && selectedAlerte && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>👷 Assigner une équipe</h2>
                <button onClick={() => setShowAssignModal(false)} className="close-btn">
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-form">
                  <label>Sélectionnez une équipe:</label>
                  <select
                    className="equipe-select"
                    value={equipe}
                    onChange={(e) => setEquipe(e.target.value)}
                  >
                    <option value="">Choisir une équipe...</option>
                    {equipes.map((eq: any) => (
                      <option key={eq._id || eq.nom || eq.Nom} value={eq.nom || eq.Nom || eq}>{eq.nom || eq.Nom || eq}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAssignModal(false)} className="cancel-btn">
                  Annuler
                </button>
                <button onClick={() => assignerEquipe(selectedAlerte._id)} className="confirm-btn">
                  Assigner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSS - Garder le même CSS que précédemment */}
        <style jsx>{`
          .alertes-container {
            min-height: 100vh;
            padding: 20px;
            position: relative;
            background: linear-gradient(135deg, #fef2f2 0%, #f0fff4 100%);
            font-family: system-ui, -apple-system, sans-serif;
          }

          .background-circle {
            position: fixed;
            border-radius: 50%;
            pointer-events: none;
          }

          .background-circle.top-right {
            top: -200px;
            right: -200px;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%);
          }

          .background-circle.bottom-left {
            bottom: -200px;
            left: -200px;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
          }

          .main-content {
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
          }

          /* Garder tout le reste du CSS inchangé */
          /* ... (garder tout le CSS précédent de la page alertes) ... */

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Responsive */
          @media (max-width: 768px) {
            .alertes-container {
              padding: 16px;
            }

            .page-title {
              font-size: 24px;
            }

            .page-subtitle {
              font-size: 14px;
            }

            .alertes-grid {
              grid-template-columns: 1fr;
            }

            .actions-grid {
              grid-template-columns: 1fr;
            }

            .alerte-content {
              padding: 0 16px 16px 16px;
            }

            .modal-content {
              width: 95%;
              margin: 16px;
            }
          }
        `}</style>
      </div>
    </RoleBasedLayout>
  );
}
