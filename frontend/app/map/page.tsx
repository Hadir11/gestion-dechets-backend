// frontend/app/map/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { fetchWastePoints, WastePoint } from '../services/api';
import Link from 'next/link';
import AuthGuard from '../components/AuthGuard';
import { authService } from '../services/auth-service';
import { API_BASE_ORIGIN, API_BASE_URL } from '../services/api-base';

export default function MapPage() {
  // ========== ÉTATS D'AUTHENTIFICATION ==========
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ========== ÉTATS DE LA CARTE ==========
  const [isLoading, setIsLoading] = useState(true);
  const [wastePoints, setWastePoints] = useState<WastePoint[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    averageLevel: 0
  });

  // ========== RÉFÉRENCES ==========
  const mapRef = useRef<any>(null);
  const initializedRef = useRef(false);

  // ========== VÉRIFICATION AUTH ==========
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    const currentUser = authService.getUser();
    setUser(currentUser);
    setAuthLoading(false);
  }, []);

  // ========== CHARGEMENT DES DONNÉES ==========
  const loadDataFromSpringBoot = async () => {

    if (!authService.isAuthenticated()) {
      setConnectionStatus('failed');
      return;
    }

    setConnectionStatus('checking');
    setWastePoints([]);

    try {
      const points = await fetchWastePoints();

      if (!points) {
        setConnectionStatus('failed');
        setWastePoints([]);
        return;
      }

      if (points.length === 0) {
        setConnectionStatus('connected');
        setWastePoints([]);
        setStats({ total: 0, critical: 0, averageLevel: 0 });
        return;
      }

      setConnectionStatus('connected');
      setWastePoints(points);

      const total = points.length;
      const critical = points.filter(p => p.niveauRemplissage >= 80).length;
      const averageLevel = total > 0
        ? Math.round(points.reduce((sum, p) => sum + p.niveauRemplissage, 0) / total)
        : 0;

      setStats({ total, critical, averageLevel });


    } catch (error) {
      console.error('💥 Erreur:', error);
      setConnectionStatus('failed');
      setWastePoints([]);
    }
  };

  // ========== INITIALISATION LEAFLET ==========
  useEffect(() => {
    if (!authService.isAuthenticated() || authLoading) {
      return;
    }

    loadDataFromSpringBoot();

    if (initializedRef.current) return;

    setIsLoading(true);

    import('leaflet').then(L => {
      const container = document.getElementById('map-container');
      if (container && (container as any)._leaflet_id) {
        setIsLoading(false);
        return;
      }

      try {
        const map = L.default.map('map-container').setView([36.8065, 10.1815], 12);
        mapRef.current = map;
        initializedRef.current = true;

        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 3
        }).addTo(map);

        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        setIsLoading(false);

      } catch (error) {
        console.error('🗺️ Erreur carte:', error);
        setIsLoading(false);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initializedRef.current = false;
      }
    };
  }, [authLoading]);

  // ========== MISE À JOUR DES POINTS SUR LA CARTE ==========
  useEffect(() => {
    if (!mapRef.current || wastePoints.length === 0) return;

    // Import paresseux : leaflet touche a window au chargement et casse le rendu serveur.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet');
    const map = mapRef.current;

    map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    wastePoints.forEach(point => {
      let color = '#2ecc71';
      if (point.niveauRemplissage >= 80) color = '#e74c3c';
      else if (point.niveauRemplissage >= 50) color = '#f39c12';

      const marker = L.circleMarker([point.latitude, point.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: 8 + (point.niveauRemplissage / 25),
        weight: 2,
      }).addTo(map);

      const popupContent = `
        <div style="min-width: 250px; padding: 10px; font-family: Arial;">
          <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${point.adresse}</h3>

          <div style="margin-bottom: 8px;">
            <strong>Niveau:</strong>
            <span style="color: ${color}; font-weight: bold; margin-left: 5px;">
              ${point.niveauRemplissage}%
            </span>
            <div style="background: #ecf0f1; height: 10px; border-radius: 5px; margin-top: 5px;">
              <div style="background: ${color}; width: ${point.niveauRemplissage}%; height: 100%; border-radius: 5px;"></div>
            </div>
          </div>

          <div style="margin-bottom: 5px;">
            <strong>Type:</strong> ${point.type}
          </div>

          <div style="margin-bottom: 5px;">
            <strong>Zone:</strong> ${point.zone?.nom || 'Non définie'}
          </div>

          <div style="margin-bottom: 5px;">
            <strong>Capacité:</strong> ${point.capaciteMax}L
          </div>

          <div style="margin-bottom: 15px;">
            <strong>État:</strong> ${point.etat}
          </div>

          <button onclick="alert('ID: ${point._id}\\nPosition: ${point.latitude}, ${point.longitude}')"
                  style="width: 100%; padding: 8px; background: #3498db; color: white;
                         border: none; border-radius: 6px; cursor: pointer;">
            📋 Voir détails techniques
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    if (wastePoints.length > 0) {
      const bounds = L.latLngBounds(
        wastePoints.map(p => [p.latitude, p.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [wastePoints]);

  // ========== CHARGEMENT AUTH ==========
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ margin: 0, color: '#2c3e50', fontWeight: '500' }}>
            Vérification de l'authentification...
          </p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!authService.isAuthenticated()) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#e74c3c' }}>⛔ Accès non autorisé</h2>
          <p>Veuillez vous connecter pour accéder à cette page.</p>
          <Link href="/login">
            <button style={{
              padding: '12px 25px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}>
              Se connecter
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ========== RENDU PRINCIPAL ==========
  return (
    <AuthGuard>
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f8fafc' }}>

        {/* EN-TÊTE */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div>
            <h1 style={{
              color: '#2c3e50',
              margin: '0 0 10px 0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              🗺️ Carte Interactive des Points de Collecte
            </h1>
            <p style={{
              color: '#7f8c8d',
              margin: 0,
              fontSize: '16px'
            }}>
              Visualisation en temps réel des déchets municipaux
            </p>
          </div>

          {/* INFO UTILISATEUR */}
          {user && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '10px 20px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#3498db',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                  {user.prenom} {user.nom}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#7f8c8d',
                  backgroundColor: '#e9ecef',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '3px'
                }}>
                  {user.role}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONTENU PRINCIPAL */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 350px',
          gap: '25px',
          alignItems: 'start'
        }}>
          {/* COLONNE GAUCHE - CARTE */}
          <div>
            {/* LÉGENDE */}
            <div style={{
              display: 'flex',
              gap: '25px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#e74c3c',
                  borderRadius: '50%',
                  marginRight: '10px',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}></div>
                <span style={{ fontWeight: '500', color: '#2c3e50' }}>Plein (≥80%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#f39c12',
                  borderRadius: '50%',
                  marginRight: '10px',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}></div>
                <span style={{ fontWeight: '500', color: '#2c3e50' }}>Moyen (50-79%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#2ecc71',
                  borderRadius: '50%',
                  marginRight: '10px',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}></div>
                <span style={{ fontWeight: '500', color: '#2c3e50' }}>Vide (&lt;50%)</span>
              </div>
            </div>

            {/* CARTE */}
            <div style={{ position: 'relative' }}>
              {isLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  borderRadius: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      border: '5px solid #f3f3f3',
                      borderTop: '5px solid #3498db',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 20px'
                    }}></div>
                    <p style={{ margin: 0, color: '#2c3e50', fontWeight: '500' }}>
                      Chargement de la carte...
                    </p>
                  </div>
                </div>
              )}

              <div
                id="map-container"
                style={{
                  height: '650px',
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 6px 25px rgba(0,0,0,0.1)',
                  border: '2px solid white'
                }}
              />
            </div>

            {/* BOUTONS D'ACTION */}
            <div style={{
              display: 'flex',
              gap: '15px',
              marginTop: '25px'
            }}>
              <Link href="/dashboard">
                <button
                  style={{
                    padding: '12px 25px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'background 0.3s',
                    flex: 1
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  ← Retour au Dashboard
                </button>
              </Link>

              <button
                onClick={loadDataFromSpringBoot}
                style={{
                  padding: '12px 25px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'background 0.3s',
                  flex: 2
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                🔄 Rafraîchir les données
              </button>
            </div>

            {/* STATUT CONNEXION */}
            <div style={{
              marginTop: '30px',
              padding: '20px',
              background: connectionStatus === 'connected' ? '#d5f4e6' :
                          connectionStatus === 'failed' ? '#fadbd8' : '#fff3cd',
              borderRadius: '10px',
              border: '1px solid ' + (connectionStatus === 'connected' ? '#c3e6cb' :
                          connectionStatus === 'failed' ? '#f5c6cb' : '#ffeaa7')
            }}>
              <h3 style={{ marginTop: 0, color: '#2c3e50', fontSize: '18px' }}>
                🔗 Connexion Backend Spring Boot
              </h3>

              {connectionStatus === 'checking' && (
                <p style={{ color: '#856404', margin: 0 }}>
                  🔄 Vérification de la connexion à Spring Boot...
                </p>
              )}

              {connectionStatus === 'connected' && (
                <div>
                  <p style={{ color: '#155724', marginBottom: '10px', fontWeight: '500' }}>
                    ✅ <strong>CONNECTÉ</strong> à Spring Boot
                  </p>
                  <div style={{ fontSize: '14px', color: '#555' }}>
                    <div>📍 <strong>Points chargés:</strong> {stats.total}</div>
                    <div>🌐 <strong>URL:</strong> {API_BASE_ORIGIN}</div>
                    <div>🗄️ <strong>Base:</strong> MongoDB</div>
                    <div>🚀 <strong>Statut:</strong> Données en temps réel</div>
                  </div>
                </div>
              )}

              {connectionStatus === 'failed' && (
                <div>
                  <p style={{ color: '#721c24', marginBottom: '10px', fontWeight: '500' }}>
                    ❌ <strong>NON CONNECTÉ</strong> à Spring Boot
                  </p>
                  <div style={{ fontSize: '14px', color: '#721c24' }}>
                    <div>⚠️ Spring Boot ne répond pas sur le port 8080</div>
                    <div>⚠️ Vérifiez que votre backend est lancé</div>
                    <div>🔧 Commande: <code style={{ background: '#f8d7da', padding: '2px 6px', borderRadius: '4px' }}>mvn spring-boot:run</code></div>
                    <div>🔗 Testez: <a href={`${API_BASE_URL}/points`} target="_blank" rel="noreferrer" style={{ color: '#721c24', textDecoration: 'underline' }}>/api/points</a></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE - STATISTIQUES */}
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: '#2c3e50',
              fontSize: '22px',
              fontWeight: 'bold'
            }}>
              📊 Statistiques en Direct
            </h3>

            <div style={{ marginBottom: '25px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#7f8c8d', fontSize: '16px' }}>Points de collecte :</span>
                <span style={{ fontWeight: '700', fontSize: '28px', color: '#2c3e50' }}>{stats.total}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '1px solid #e9ecef'
              }}>
                <span style={{ color: '#7f8c8d', fontSize: '16px' }}>Points critiques (≥80%) :</span>
                <span style={{ fontWeight: '700', color: '#e74c3c', fontSize: '24px' }}>{stats.critical}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <span style={{ color: '#7f8c8d', fontSize: '16px' }}>Niveau moyen :</span>
                <span style={{ fontWeight: '700', color: '#f39c12', fontSize: '24px' }}>{stats.averageLevel}%</span>
              </div>

              {/* BARRE DE PROGRESSION */}
              <div style={{
                height: '12px',
                backgroundColor: '#e0e0e0',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '30px'
              }}>
                <div style={{
                  width: `${stats.averageLevel}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2ecc71, #f39c12, #e74c3c)',
                  borderRadius: '6px'
                }}></div>
              </div>
            </div>

            {/* POINTS CRITIQUES */}
            <h4 style={{
              margin: '0 0 15px 0',
              color: '#2c3e50',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              🚨 Points nécessitant une collecte
            </h4>

            {wastePoints.filter(p => p.niveauRemplissage >= 80).slice(0, 5).map(point => (
              <div key={point._id} style={{
                backgroundColor: '#fff5f5',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '12px',
                borderLeft: '4px solid #e74c3c'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#e74c3c',
                    borderRadius: '50%',
                    marginRight: '10px'
                  }}></div>
                  <span style={{ fontWeight: '600', color: '#2c3e50', fontSize: '15px' }}>
                    {point.adresse.split(',')[0]}
                  </span>
                  <span style={{ marginLeft: 'auto', color: '#e74c3c', fontWeight: '700', fontSize: '16px' }}>
                    {point.niveauRemplissage}%
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#7f8c8d', paddingLeft: '22px' }}>
                  {point.type} • {point.zone?.nom || 'Sans zone'} • {point.capaciteMax}L
                </div>
              </div>
            ))}

            {wastePoints.filter(p => p.niveauRemplissage >= 80).length === 0 && (
              <div style={{
                backgroundColor: '#d5f4e6',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #c3e6cb'
              }}>
                <span style={{ color: '#155724', fontWeight: '500' }}>✅ Aucun point critique</span>
                <div style={{ fontSize: '13px', color: '#155724', marginTop: '5px' }}>
                  Tous les points sont sous 80% de remplissage
                </div>
              </div>
            )}

            {/* TOUS LES POINTS */}
            <div style={{ marginTop: '30px' }}>
              <h4 style={{
                margin: '0 0 15px 0',
                color: '#2c3e50',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                📍 Tous les points
              </h4>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {wastePoints.slice(0, 10).map((point, index) => (
                  <div key={point._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < 9 ? '1px solid #e9ecef' : 'none'
                  }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: point.niveauRemplissage >= 80 ? '#e74c3c' :
                                       point.niveauRemplissage >= 50 ? '#f39c12' : '#2ecc71',
                      borderRadius: '50%',
                      marginRight: '10px'
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50', fontSize: '14px' }}>
                        {point.adresse.substring(0, 30)}...
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {point.niveauRemplissage}% • {point.type}
                      </div>
                    </div>
                  </div>
                ))}
                {wastePoints.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#6c757d', padding: '10px' }}>
                    Aucun point chargé
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STYLE CSS GLOBAL */}
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
            background-color: #f8fafc;
          }

          button {
            font-family: inherit;
            transition: all 0.2s ease;
          }

          button:hover {
            transform: translateY(-1px);
          }

          a {
            text-decoration: none;
          }

          code {
            font-family: 'Courier New', monospace;
          }

          /* Scrollbar personnalisée */
          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
