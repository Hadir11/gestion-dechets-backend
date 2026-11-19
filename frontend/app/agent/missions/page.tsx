'use client';

import RoleBasedLayout from '../../components/RoleBasedLayout';
import { authService } from '../../services/auth-service';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../services/api-base';

interface Mission {
  id: string;
  nom: string;
  vehicule: string;
  status: string;
  points: PointCollecte[];
}

interface TourneeApi {
  _id?: string;
  id?: string;
  date?: string;
  status?: string;
  employe?: { username?: string } | string | null;
  vehicule?: { immatriculation?: string; marque?: string; modele?: string } | string | null;
  pointsCollecte?: Array<{
    _id?: string;
    id?: string;
    nom?: string;
    adresse?: string;
    niveauRemplissage?: number;
  }>;
}

interface PointCollecte {
  id: string;
  nom: string;
  adresse: string;
  niveauRemplissage: number;
}

export default function AgentMissionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState<Mission | null>(null);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState('Véhicule en panne');
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Types de problèmes
  const problemTypes = [
    'Véhicule en panne',
    'Point inaccessible',
    'Déchets dangereux',
    'Conteneur endommagé',
    'Route bloquée',
    'Autre problème'
  ];

  useEffect(() => {
    fetchMission();
  }, []);

  const fetchMission = async () => {
    try {
      setLoading(true);
      setMissionError(null);
      const token = authService.getToken();

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/agent/mes-tournees`, {
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status} lors du chargement des tournées`);
      }

      const user = authService.getUser();
      const data: TourneeApi[] = await response.json();
      const normalizeStatus = (status = '') => status
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[ _-]+/g, ' ')
        .trim()
        .toUpperCase();
      const assignedTournee = (Array.isArray(data) ? data : []).find((tournee) => {
        const assignedUsername = typeof tournee.employe === 'object' && tournee.employe
          ? tournee.employe.username
          : undefined;
        const status = normalizeStatus(tournee.status);
        return assignedUsername === user?.username && (status === 'PLANIFIEE' || status === 'EN COURS');
      });

      if (!assignedTournee) {
        setMission(null);
        return;
      }

      const vehicle = typeof assignedTournee.vehicule === 'string'
        ? assignedTournee.vehicule
        : [assignedTournee.vehicule?.marque, assignedTournee.vehicule?.modele, assignedTournee.vehicule?.immatriculation]
          .filter(Boolean)
          .join(' • ');
      const missionDate = assignedTournee.date
        ? new Date(assignedTournee.date).toLocaleDateString('fr-FR')
        : '';

      setMission({
        id: assignedTournee._id || assignedTournee.id || 'tournee',
        nom: `Tournée${missionDate ? ` du ${missionDate}` : ''}`,
        vehicule: vehicle || 'Véhicule non renseigné',
        status: assignedTournee.status || 'Planifiée',
        points: (assignedTournee.pointsCollecte || []).map((point, index) => ({
          id: point._id || point.id || `point-${index}`,
          nom: point.nom || 'Point de collecte',
          adresse: point.adresse || 'Adresse non renseignée',
          niveauRemplissage: Number(point.niveauRemplissage || 0),
        })),
      });
    } catch (err) {
      console.error('Erreur lors du chargement de la mission:', err);
      setMission(null);
      setMissionError(err instanceof Error ? err.message : 'Impossible de charger votre mission.');
    } finally {
      setLoading(false);
    }
  };

  const signalerProbleme = async () => {
    if (!alertMessage.trim()) {
      alert('Veuillez décrire le problème');
      return;
    }

    try {
      setSubmitting(true);
      const token = authService.getToken();

      if (!token) {
        alert('Veuillez vous reconnecter');
        return;
      }

      // Récupérer le point sélectionné
      const pointSelectionne = mission?.points.find(p => p.id === selectedPoint);

      // Préparer les données pour l'API
      const alerteData = {
        pointCollecteId: pointSelectionne?.id || null,
        typeAlerte: selectedProblem,
        message: alertMessage,
        niveauRemplissage: pointSelectionne?.niveauRemplissage || 0,
      };

      const response = await fetch(`${API_BASE_URL}/alertes`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(alerteData),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: l’alerte n’a pas été enregistrée`);
      }

      setShowAlertModal(false);
      setSelectedProblem('Véhicule en panne');
      setAlertMessage('');
      setSelectedPoint('');
      alert('Alerte signalée avec succès.');
    } catch (err) {
      console.error('Erreur complète:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors du signalement de l’alerte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleBasedLayout>
      <div className="agent-missions-container">
        {/* Background effects */}
        <div className="background-circle top-right"></div>
        <div className="background-circle bottom-left"></div>

        <div className="main-content">
          {/* Header */}
          <div className="page-header">
            <div className="header-left">
              <h1 className="page-title">✅ Mes Missions du Jour</h1>
              <p className="page-subtitle">
                Suivez et gérez vos missions de collecte quotidiennes
              </p>
            </div>

            <div className="header-right">
              <button
                onClick={() => setShowAlertModal(true)}
                className="alerte-btn"
              >
                <span className="alerte-icon">🚨</span>
                Signaler un problème
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement de votre mission...</p>
            </div>
          ) : missionError ? (
            <div className="empty-state" role="alert">
              <div className="empty-icon">⚠️</div>
              <h3>Mission indisponible</h3>
              <p>{missionError}</p>
              <button className="submit-btn" onClick={fetchMission}>Réessayer</button>
            </div>
          ) : mission ? (
            <>
              {/* Current Mission */}
              <div className="current-mission-card">
                <div className="card-header">
                  <h2>Mission en cours</h2>
                  <span className="status-badge">{mission.status}</span>
                </div>

                <div className="mission-content">
                  <div className="vehicle-info">
                    <div className="vehicle-icon">
                      🚚
                    </div>
                    <div>
                      <div className="vehicle-name">{mission.nom}</div>
                      <div className="vehicle-details">{mission.vehicule}</div>
                    </div>
                  </div>

                  <div className="collection-points">
                    <h3>Points à collecter:</h3>
                    <div className="points-list">
                      {mission.points.map((point) => (
                        <div key={point.id} className="point-item">
                          <div className="point-info">
                            <div className="point-name">📍 {point.nom}</div>
                            <div className="point-details">
                              <span className="point-adresse">{point.adresse}</span>
                              <span className="point-niveau">
                                Niveau: {point.niveauRemplissage}%
                                <div className="mini-progress">
                                  <div
                                    className="mini-progress-fill"
                                    style={{ width: `${point.niveauRemplissage}%` }}
                                  ></div>
                                </div>
                              </span>
                            </div>
                          </div>
                          <button className="collect-btn">
                            ✅ Collecté
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rapport de mission */}
              <div className="action-card">
                <div className="card-header">
                  <h3>📋 Rapport de mission</h3>
                </div>
                <textarea
                  className="report-textarea"
                  rows={4}
                  placeholder="Notes sur la mission, observations, difficultés rencontrées..."
                />
                <button className="submit-btn">
                  📤 Soumettre le rapport
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Aucune mission planifiée</h3>
              <p>Vous n'avez pas de mission assignée pour aujourd'hui</p>
            </div>
          )}
        </div>

        {/* Modal de signalement d'alerte */}
        {showAlertModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>⚠️ Signaler un problème</h2>
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="close-btn"
                  disabled={submitting}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-form">
                  <div className="form-group">
                    <label>Type de problème:</label>
                    <select
                      className="problem-select"
                      value={selectedProblem}
                      onChange={(e) => setSelectedProblem(e.target.value)}
                      disabled={submitting}
                    >
                      {problemTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {mission && mission.points.length > 0 && (
                    <div className="form-group">
                      <label>Point concerné (optionnel):</label>
                      <select
                        className="point-select"
                        value={selectedPoint}
                        onChange={(e) => setSelectedPoint(e.target.value)}
                        disabled={submitting}
                      >
                        <option value="">Sélectionner un point...</option>
                        {mission.points.map((point) => (
                          <option key={point.id} value={point.id}>
                            📍 {point.nom} - {point.adresse}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Description du problème:</label>
                    <textarea
                      className="alert-textarea"
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      placeholder="Décrivez le problème en détails..."
                      rows={4}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="cancel-btn"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  onClick={signalerProbleme}
                  className="confirm-btn"
                  disabled={!alertMessage.trim() || submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-mini"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      🚨 Signaler l'urgence
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSS avec ajout du spinner mini */}
        <style jsx>{`
          .agent-missions-container {
            min-height: 100vh;
            padding: 20px;
            position: relative;
            background: linear-gradient(135deg, #f0f9ff 0%, #f0fff4 100%);
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
            background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          }

          .background-circle.bottom-left {
            bottom: -200px;
            left: -200px;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
          }

          .main-content {
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
          }

          /* Header */
          .page-header {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 30px;
          }

          @media (min-width: 768px) {
            .page-header {
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
            }
          }

          .header-left {
            flex: 1;
          }

          .page-title {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 8px 0;
          }

          .page-subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
          }

          .alerte-btn {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 12px 24px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
          }

          .alerte-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(239, 68, 68, 0.4);
          }

          .alerte-icon {
            font-size: 20px;
          }

          /* Loading State */
          .loading-state {
            padding: 60px 20px;
            text-align: center;
          }

          .loading-state .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            margin: 0 auto 20px;
            animation: spin 1s linear infinite;
          }

          .loading-state p {
            color: #6b7280;
            margin: 0;
          }

          /* Spinner mini */
          .spinner-mini {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }

          /* Modal improvements */
          .modal-content {
            max-height: 90vh;
            overflow-y: auto;
          }

          .confirm-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .confirm-btn:not(:disabled):hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          }

          /* Garder tout le reste du CSS inchangé */
          /* ... (garder tout le CSS précédent) ... */

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Responsive */
          @media (max-width: 768px) {
            .agent-missions-container {
              padding: 16px;
            }

            .page-title {
              font-size: 24px;
            }

            .page-subtitle {
              font-size: 14px;
            }

            .point-item {
              flex-direction: column;
              gap: 12px;
              text-align: center;
            }

            .collect-btn {
              width: 100%;
            }

            .report-textarea,
            .submit-btn {
              margin: 16px;
              width: calc(100% - 32px);
            }

            .modal-content {
              width: 95%;
              margin: 16px;
              max-height: 85vh;
            }
          }
        `}</style>
      </div>
    </RoleBasedLayout>
  );
}
