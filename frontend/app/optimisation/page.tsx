'use client';

import { useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import Link from 'next/link';
import { API_BASE_URL } from '../services/api-base';
import { authService } from '../services/auth-service';

interface Tournee {
  _id: string;
  date: string;
  heureDepart: string;
  heureFinEstimee?: string;
  status: string;
  dureeEstimee: number;
  distanceEstimee: number;
  pointsCollecte: any[];
  vehicule: any;
  employe: any;
}

interface Statistiques {
  pointsVisites?: number;
  distanceEstimeeKm?: number;
  dureeEstimeeMinutes?: number;
  heureFinEstimee?: string;
}

export default function OptimisationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    tournee?: Tournee;
    statistiques?: Statistiques;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fonction pour lancer l'optimisation
  const lancerOptimisation = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tournees/optimiser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || `Erreur ${response.status}`);
      setResult(data);
    } catch (error) {
      console.error('Erreur optimisation:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Impossible de contacter le serveur.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f9fafb', minHeight: '100vh' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              🚀 Optimisation des Tournées
            </h1>
            <Link href="/dashboard">
              <button style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                ← Retour Dashboard
              </button>
            </Link>
          </div>

          <p style={{ color: '#6b7280', fontSize: '16px', lineHeight: '1.5' }}>
            L’algorithme ordonne les points critiques selon leur proximité géographique. Les distances sont des estimations à vol d’oiseau, pas des itinéraires routiers.
          </p>
        </div>

        {/* Section principale */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          alignItems: 'start'
        }}>

          {/* Colonne gauche - Contrôles */}
          <div>
            {/* Carte d'information */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '25px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '25px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '15px' }}>
                🧭 Ordonnancement des points
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '15px' }}>
                Le calcul commence par les points de collecte dont le remplissage dépasse 70 %, puis les ordonne par proximité géographique.
              </p>

              <div style={{
                backgroundColor: '#f8fafc',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '20px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '10px' }}>
                  Étapes de l'optimisation :
                </h3>
                <ol style={{ color: '#6b7280', margin: 0, paddingLeft: '20px' }}>
                  <li>Récupération des points critiques ({'>'}70%)</li>
                  <li>Calcul des distances géographiques estimées</li>
                  <li>Ordonnancement glouton par plus proche voisin</li>
                  <li>Enregistrement d’une tournée planifiée</li>
                  <li>Affectation du véhicule disponible</li>
                  <li>Calcul des statistiques d'économie</li>
                </ol>
              </div>
            </div>

            {/* Bouton d'optimisation */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '25px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <button
                onClick={lancerOptimisation}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  padding: '15px 40px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  width: '100%',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid rgba(255,255,255,0.3)',
                      borderTop: '3px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Optimisation en cours...
                  </>
                ) : (
                  '🚀 Lancer l\'optimisation automatique'
                )}
              </button>

              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '15px' }}>
                Cliquez pour générer la tournée optimisée en utilisant l'IA
              </p>
            </div>
          </div>

          {/* Colonne droite - Résultats */}
          <div>
            {result && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '25px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    {result.success ? '✅ Résultats' : '❌ Erreur'}
                  </h2>
                  {result.tournee && <button
                    onClick={() => setShowDetails(!showDetails)}
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {showDetails ? 'Masquer détails' : 'Afficher détails'}
                  </button>}
                </div>

                <p style={{ color: result.success ? '#10b981' : '#ef4444', marginBottom: '20px' }}>
                  {result.message}
                </p>

                {/* Statistiques */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '15px',
                  marginBottom: '20px'
                }}>
                  {result.statistiques && Object.entries(result.statistiques).map(([key, value]) => (
                    <div key={key} style={{
                      backgroundColor: '#f9fafb',
                      padding: '15px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: '5px'
                      }}>
                        {value}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Détails de la tournée */}
                {showDetails && result.tournee && (
                  <div style={{
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '20px',
                    marginTop: '20px'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '15px' }}>
                      📋 Détails de la tournée
                    </h3>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '15px',
                      marginBottom: '20px'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>ID Tournée</div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{result.tournee._id}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Date/Heure</div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {result.tournee.date} {result.tournee.heureDepart}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Véhicule</div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {result.tournee.vehicule?.matricule || 'Non spécifié'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Employé</div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {result.tournee.employe ? `${result.tournee.employe.prenom} ${result.tournee.employe.nom}` : 'Non affecté'}
                        </div>
                      </div>

                      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>⏰</span>
        <div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Fin estimée de la tournée</div>
          <div style={{ fontWeight: '600', color: '#111827' }}>
            {result.tournee.heureFinEstimee || 'Non renseignée'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
            Le véhicule sera libéré automatiquement à cette heure
          </div>
        </div>
      </div>
    </div>

                    </div>

                    {/* Points de collecte */}
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '10px' }}>
                      📍 Points à collecter ({result.tournee.pointsCollecte?.length || 0})
                    </h4>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      padding: '15px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {(result.tournee.pointsCollecte ?? []).map((point: any, index: number, points: any[]) => (
                        <div key={point._id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: index < points.length - 1 ? '1px solid #e5e7eb' : 'none'
                        }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            marginRight: '15px'
                          }}>
                            {index + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', color: '#111827' }}>
                              {point.adresse}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', gap: '15px', marginTop: '5px' }}>
                              <span>Niveau: {point.niveauRemplissage}%</span>
                              <span>Type: {point.type}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>📊 Mesures de la tournée</h3>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>Les distances sont estimées à partir des coordonnées géographiques. Aucune comparaison historique ni économie réelle n’est calculée.</p>
              {result?.tournee ? (
                <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  <div><dt style={{ color: '#6b7280', fontSize: '13px' }}>Points à visiter</dt><dd style={{ fontWeight: 600 }}>{result.tournee.pointsCollecte?.length ?? 0}</dd></div>
                  <div><dt style={{ color: '#6b7280', fontSize: '13px' }}>Distance estimée</dt><dd style={{ fontWeight: 600 }}>{Number(result.tournee.distanceEstimee).toFixed(2)} km</dd></div>
                  <div><dt style={{ color: '#6b7280', fontSize: '13px' }}>Durée estimée</dt><dd style={{ fontWeight: 600 }}>{result.tournee.dureeEstimee} min</dd></div>
                  <div><dt style={{ color: '#6b7280', fontSize: '13px' }}>Fin estimée</dt><dd style={{ fontWeight: 600 }}>{result.tournee.heureFinEstimee || '—'}</dd></div>
                </dl>
              ) : <p style={{ color: '#6b7280' }}>Les mesures apparaîtront après une optimisation réussie.</p>}
            </div>
          </div>
        </div>

        {/* Styles */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
