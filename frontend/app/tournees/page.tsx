// app/tournees/page.tsx - Page pour voir toutes les tournées
'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../components/AuthGuard';
import { authService } from '../services/auth-service';
import { API_BASE_URL } from '../services/api-base';

export default function TourneesPage() {
  const [tournees, setTournees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournees();
  }, []);

  const fetchTournees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tournees`, {
        headers: authService.getAuthHeaders(),
      });
      const data = await response.json();
      setTournees(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px' }}>
          📋 Historique des Tournées
        </h1>

        {loading ? (
          <div>Chargement...</div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {tournees.map((tournee: any) => (
              <div key={tournee._id} style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontWeight: '600' }}>Tournée {tournee._id}</h3>
                  <span style={{
                    backgroundColor: tournee.status === 'PLANIFIÉE' ? '#fbbf24' :
                                   tournee.status === 'TERMINÉE' ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    {tournee.status}
                  </span>
                </div>

                <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>Date</div>
                    <div style={{ fontWeight: '500' }}>{tournee.date}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>Heure départ</div>
                    <div style={{ fontWeight: '500' }}>{tournee.heureDepart}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>Distance</div>
                    <div style={{ fontWeight: '500' }}>{tournee.distanceEstimee} km</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>Points</div>
                    <div style={{ fontWeight: '500' }}>{tournee.pointsCollecte?.length || 0}</div>
                  </div>
                </div>

                {tournee.vehicule && (
                  <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Véhicule</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🚚</span>
                      <span style={{ fontWeight: '500' }}>{tournee.vehicule.matricule}</span>
                      <span style={{
                        backgroundColor: tournee.vehicule.disponible ? '#10b981' : '#ef4444',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {tournee.vehicule.disponible ? 'Disponible' : 'En tournée'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
