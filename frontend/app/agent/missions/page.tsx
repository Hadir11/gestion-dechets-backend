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
  vehicule?: { matricule?: string; typeVehicule?: string } | string | null;
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
        : [assignedTournee.vehicule?.typeVehicule, assignedTournee.vehicule?.matricule]
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
            position: relative;
            min-height: 100vh;
            padding: 32px 24px 64px;
            background: linear-gradient(135deg, #f2fbf6 0%, #f7fbff 100%);
            overflow: hidden;
          }
          .background-circle {
            position: absolute;
            border-radius: 50%;
            filter: blur(70px);
            opacity: 0.32;
            pointer-events: none;
          }
          .top-right { width: 380px; height: 380px; top: -150px; right: -120px; background: #b7f0d4; }
          .bottom-left { width: 420px; height: 420px; bottom: -190px; left: -160px; background: #cfe4ff; }
          .main-content {
            position: relative;
            max-width: 1100px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .page-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            flex-wrap: wrap;
          }
          .page-title { margin: 0 0 6px; font-size: 30px; font-weight: 800; color: #0f172a; }
          .page-subtitle { margin: 0; font-size: 15px; color: #64748b; }
          .header-right { display: flex; align-items: center; gap: 12px; }

          .alerte-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 13px 18px;
            border: 0;
            border-radius: 12px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: #fff;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(220, 38, 38, 0.25);
          }
          .alerte-btn:hover { filter: brightness(1.05); }
          .alerte-icon { font-size: 18px; }

          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            padding: 64px 0;
            color: #64748b;
          }
          .spinner {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 3px solid #d8e6f5;
            border-top-color: #2563eb;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          .empty-state {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 64px 24px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
          }
          .empty-icon { font-size: 34px; margin-bottom: 10px; }
          .empty-state h3 { margin: 0 0 6px; font-size: 18px; color: #0f172a; }
          .empty-state p { margin: 0 0 18px; color: #64748b; }

          .current-mission-card,
          .action-card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
            overflow: hidden;
          }
          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 18px 22px;
            background: #fff7f7;
            border-bottom: 1px solid #f6e7e7;
          }
          .card-header h2 { margin: 0; font-size: 18px; color: #0f172a; }
          .card-header h3 { margin: 0; font-size: 16px; color: #0f172a; }
          .status-badge {
            padding: 4px 12px;
            border-radius: 999px;
            background: #fffbeb;
            color: #b45309;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.04em;
          }

          .mission-content {
            padding: 22px;
            display: flex;
            flex-direction: column;
            gap: 22px;
          }
          .vehicle-info {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 16px;
            background: #f8fafc;
            border: 1px solid #eef2f7;
            border-radius: 12px;
          }
          .vehicle-icon { font-size: 26px; }
          .vehicle-name { font-weight: 700; color: #0f172a; }
          .vehicle-details { margin-top: 2px; font-size: 14px; color: #64748b; }

          .collection-points h3 { margin: 0 0 12px; font-size: 15px; color: #334155; }
          .points-list { display: flex; flex-direction: column; gap: 12px; }
          .point-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 16px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #fff;
          }
          .point-info { flex: 1; min-width: 0; }
          .point-name { margin-bottom: 4px; font-weight: 600; color: #0f172a; }
          .point-details {
            display: flex;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
            font-size: 13px;
            color: #64748b;
          }
          .point-adresse { white-space: nowrap; }
          .point-niveau { display: inline-flex; align-items: center; gap: 8px; }
          .mini-progress {
            width: 90px;
            height: 6px;
            border-radius: 999px;
            background: #e5e7eb;
            overflow: hidden;
          }
          .mini-progress-fill {
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #34d399, #10b981);
          }

          .collect-btn {
            padding: 9px 14px;
            border: 1px solid #d1fae5;
            border-radius: 10px;
            background: #ecfdf5;
            color: #047857;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
          }
          .collect-btn:hover { background: #d1fae5; }

          .report-textarea {
            display: block;
            width: calc(100% - 44px);
            margin: 18px 22px 14px;
            padding: 12px 14px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            font-family: inherit;
            font-size: 14px;
            color: #0f172a;
            resize: vertical;
            min-height: 92px;
          }
          .submit-btn {
            margin: 0 22px 20px;
            padding: 10px 16px;
            border: 0;
            border-radius: 10px;
            background: #059669;
            color: #fff;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
          }
          .submit-btn:hover { background: #047857; }

          .modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 60;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(15, 23, 42, 0.55);
          }
          .modal-content {
            width: min(560px, 100%);
            max-height: 90vh;
            overflow: auto;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
          }
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 18px 22px;
            border-bottom: 1px solid #eef2f7;
          }
          .modal-header h2 { margin: 0; font-size: 18px; color: #0f172a; }
          .close-btn {
            border: 0;
            background: transparent;
            color: #64748b;
            font-size: 22px;
            line-height: 1;
            cursor: pointer;
          }
          .modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
          .modal-form { display: flex; flex-direction: column; gap: 16px; }
          .form-group { display: flex; flex-direction: column; gap: 6px; }
          .form-group label { font-size: 13px; font-weight: 600; color: #334155; }
          .problem-select,
          .point-select,
          .alert-textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #fff;
            font-family: inherit;
            font-size: 14px;
            color: #0f172a;
          }
          .alert-textarea { min-height: 92px; resize: vertical; }
          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 8px 22px 22px;
          }
          .cancel-btn {
            padding: 10px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #fff;
            color: #475569;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
          }
          .confirm-btn {
            padding: 10px 16px;
            border: 0;
            border-radius: 10px;
            background: #dc2626;
            color: #fff;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
          }
          .confirm-btn:disabled { opacity: 0.6; cursor: default; }
          .spinner-mini {
            display: inline-block;
            width: 12px;
            height: 12px;
            margin-right: 6px;
            vertical-align: -1px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.45);
            border-top-color: #fff;
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    </RoleBasedLayout>
  );
}
