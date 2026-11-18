'use client';

import RoleBasedLayout from '../../components/RoleBasedLayout';
import { authService } from '../../services/auth-service';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../services/api-base';

interface Agent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  roleCode: string;
  username: string;
  matricule?: string;
  isActive: boolean;
  createdAt: string;
}

export default function ChefEquipePage() {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tours = [
    { id: 1, name: 'Tournée Centre-Ville', points: 3, distance: '15.8km', duration: '267min', progress: 75 },
    { id: 2, name: 'Zone Industrielle', points: 5, distance: '22.4km', duration: '312min', progress: 45 },
    { id: 3, name: 'Quartier Résidentiel', points: 4, distance: '18.2km', duration: '245min', progress: 100 },
  ];

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
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

      const allEmployes = await response.json();
      const agentsOnly = allEmployes.filter((employe: Agent) =>
        employe.roleCode === 'AGENT' ||
        employe.roleCode === 'AGENT_COLLECTE' ||
        employe.role === 'Agent de collecte'
      );

      setAgents(agentsOnly);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des agents');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAgentsByStatus = () => {
    return {
      available: agents.filter(a => a.isActive).length,
      onMission: agents.filter(a => !a.isActive).length,
      break: 0,
      total: agents.length
    };
  };

  const stats = getAgentsByStatus();

  const getRoleDisplayName = (roleCode: string, role: string) => {
    const roleMap: Record<string, string> = {
      'AGENT': 'Agent de collecte',
      'AGENT_COLLECTE': 'Agent de collecte',
      'CHEF-EQUIPE': 'Chef d\'équipe',
      'ADMIN': 'Administrateur'
    };

    return roleMap[roleCode] || role || 'Agent';
  };

  const getAgentStatus = (agent: Agent) => {
    return agent.isActive ? 'available' : 'on-mission';
  };

  // Fonction pour rediriger vers la page des alertes
  const handleSignalerIncident = () => {
    router.push('/chef/alertes');
  };

  // Fonction pour affecter une mission (à implémenter)
  const handleAffecterMission = () => {
    // À implémenter: ouvrir un modal ou rediriger vers une page de création de mission
    alert('Fonctionnalité "Affecter une mission" à implémenter');
  };

  // Fonction pour voir les statistiques de l'équipe
  const handleVoirStatistiques = () => {
    // À implémenter: rediriger vers la page de statistiques
    alert('Fonctionnalité "Statistiques équipe" à implémenter');
  };

  // Fonction pour planifier une tournée
  const handlePlanifierTournee = () => {
    // À implémenter: rediriger vers la page de planification
    alert('Fonctionnalité "Planifier tournée" à implémenter');
  };

  return (
    <RoleBasedLayout>
      <div className="chef-equipe-container">
        {/* Background effects */}
        <div className="background-circle top-right"></div>
        <div className="background-circle bottom-left"></div>

        <div className="main-content">
          {/* Header */}
          <div className="page-header">
            <div className="header-left">
              <h1 className="page-title">👨‍💼 Mon Équipe</h1>
              <p className="page-subtitle">
                Gestion et supervision de votre équipe d'agents de collecte
              </p>
            </div>

            <div className="header-right">
              <div className="agents-counter">
                <span className="counter-icon">👥</span>
                <span className="counter-text">{stats.total} agents</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {[
              { label: 'Disponibles', value: stats.available, color: 'green', icon: '✅' },
              { label: 'En mission', value: stats.onMission, color: 'blue', icon: '🚚' },
              { label: 'En pause', value: stats.break, color: 'yellow', icon: '⏸️' },
              { label: 'Missions actives', value: tours.length, color: 'purple', icon: '📋' },
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
                <button onClick={fetchAgents} className="retry-btn">
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement des agents...</p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {/* Main Column */}
              <div className="main-column">
                {/* Agents Card */}
                <div className="card agents-section">
                  <div className="card-header">
                    <h2>👥 Agents de Collecte</h2>
                    <p>Cliquez sur un agent pour plus de détails</p>
                    <button onClick={fetchAgents} className="refresh-btn">
                      <span>🔄</span> Actualiser
                    </button>
                  </div>

                  {agents.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">👤</div>
                      <h3>Aucun agent trouvé</h3>
                      <p>Il n'y a pas d'agents de collecte dans le système</p>
                    </div>
                  ) : (
                    <div className="agents-list">
                      {agents.map((agent) => {
                        const status = getAgentStatus(agent);
                        return (
                          <div
                            key={agent.id}
                            className={`agent-item ${selectedAgent === agent.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAgent(agent.id)}
                          >
                            <div className="agent-info">
                              <div className="agent-avatar">
                                <div className="avatar-circle">
                                  {agent.prenom.charAt(0)}{agent.nom.charAt(0)}
                                </div>
                                <div className={`status-dot ${status}`}></div>
                              </div>

                              <div className="agent-details">
                                <h3>{agent.prenom} {agent.nom}</h3>
                                <div className="agent-tags">
                                  <span className={`status-tag ${status}`}>
                                    {status === 'available' ? 'Disponible' : 'En mission'}
                                  </span>
                                  <span className="role-tag">
                                    {getRoleDisplayName(agent.roleCode, agent.role)}
                                  </span>
                                  {agent.matricule && (
                                    <span className="matricule-tag">
                                      #{agent.matricule}
                                    </span>
                                  )}
                                </div>
                                <div className="contact-info">
                                  <span>📱 {agent.telephone}</span>
                                  <span>📧 {agent.email}</span>
                                </div>
                              </div>
                            </div>

                            <div className="agent-actions">
                              <button className="icon-btn" title="Envoyer message">
                                💬
                              </button>
                              <button className="icon-btn" title="Appeler">
                                📞
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tours Card */}
                <div className="card tours-section">
                  <div className="card-header">
                    <h2>🗺️ Tournées du Jour</h2>
                  </div>

                  <div className="tours-list">
                    {tours.map((tour) => (
                      <div key={tour.id} className="tour-item">
                        <div className="tour-header">
                          <h3>{tour.name}</h3>
                          <div className="tour-stats">
                            <span>📍 {tour.points} points</span>
                            <span>📏 {tour.distance}</span>
                            <span>⏱️ {tour.duration}</span>
                          </div>
                        </div>

                        <div className="tour-footer">
                          <div className="progress-section">
                            <div className="progress-header">
                              <span>Progression</span>
                              <span>{tour.progress}%</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${tour.progress === 100 ? 'complete' : tour.progress >= 50 ? 'good' : 'average'}`}
                                style={{ width: `${tour.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <button className="details-btn">
                            Détails
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="sidebar-column">
                {/* Quick Actions - MODIFIÉ ICI */}
                <div className="card actions-section">
                  <div className="card-header">
                    <h2>⚡ Actions Rapides</h2>
                  </div>

                  <div className="actions-list">
                    {/* Bouton 1: Affecter une mission */}
                    <button
                      onClick={handleAffecterMission}
                      className="action-btn blue"
                    >
                      <span>📋</span>
                      <span>Affecter une mission</span>
                    </button>

                    {/* Bouton 2: Signaler un incident - REDIRIGE VERS /chef/alertes */}
                    <button
                      onClick={handleSignalerIncident}
                      className="action-btn green"
                    >
                      <span>🚨</span>
                      <span>Signaler un incident</span>
                    </button>

                    {/* Bouton 3: Statistiques équipe */}
                    <button
                      onClick={handleVoirStatistiques}
                      className="action-btn purple"
                    >
                      <span>📊</span>
                      <span>Statistiques équipe</span>
                    </button>

                    {/* Bouton 4: Planifier tournée */}
                    <button
                      onClick={handlePlanifierTournee}
                      className="action-btn yellow"
                    >
                      <span>📅</span>
                      <span>Planifier tournée</span>
                    </button>
                  </div>
                </div>

                {/* Détails agent sélectionné */}
                {selectedAgent && (() => {
                  const agent = agents.find(a => a.id === selectedAgent);
                  if (!agent) return null;
                  const status = getAgentStatus(agent);

                  return (
                    <div className="card agent-details-section">
                      <div className="card-header">
                        <h2>👤 Détails Agent</h2>
                      </div>

                      <div className="agent-detail-content">
                        <div className="agent-profile">
                          <div className="profile-avatar">
                            {agent.prenom.charAt(0)}{agent.nom.charAt(0)}
                          </div>
                          <div className="profile-info">
                            <h3>{agent.prenom} {agent.nom}</h3>
                            <div className="profile-contact">
                              <span>📱 {agent.telephone}</span>
                              <span>📧 {agent.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="agent-stats-details">
                          <div className="stat-row">
                            <span>Statut:</span>
                            <span className={`status ${status}`}>
                              {status === 'available' ? 'Disponible' : 'En mission'}
                            </span>
                          </div>

                          <div className="stat-row">
                            <span>Rôle:</span>
                            <span className="role">{getRoleDisplayName(agent.roleCode, agent.role)}</span>
                          </div>

                          <div className="stat-row">
                            <span>Matricule:</span>
                            <span>{agent.matricule || 'Non assigné'}</span>
                          </div>

                          <div className="stat-row">
                            <span>Actif depuis:</span>
                            <span>{new Date(agent.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>

                        <div className="agent-buttons">
                          <button className="secondary-btn blue">
                            Contacter
                          </button>
                          <button className="secondary-btn green">
                            Assigner mission
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Statistiques rapides */}
                <div className="card performance-section">
                  <div className="card-header">
                    <h2>📈 Aperçu Performance</h2>
                  </div>

                  <div className="performance-content">
                    {[
                      { label: 'Productivité équipe', value: 87, color: 'green' },
                      { label: 'Taux réussite missions', value: 94, color: 'blue' },
                      { label: 'Satisfaction clients', value: 91, color: 'purple' },
                    ].map((item, index) => (
                      <div key={index} className="performance-item">
                        <div className="performance-label">
                          <span>{item.label}</span>
                          <span>{item.value}%</span>
                        </div>
                        <div className="performance-bar">
                          <div
                            className={`performance-fill ${item.color}`}
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CSS */}
        <style jsx>{`
          .chef-equipe-container {
            min-height: 100vh;
            padding: 20px;
            position: relative;
            background: linear-gradient(135deg, #f0f9ff 0%, #f0fff4 100%);
            font-family: system-ui, -apple-system, sans-serif;
            overflow-x: hidden;
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
            max-width: 1400px;
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

          .agents-counter {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 12px 20px;
            border: 1px solid rgba(229, 231, 235, 0.8);
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .counter-icon {
            font-size: 20px;
          }

          .counter-text {
            font-weight: 500;
            color: #374151;
          }

          /* Stats Grid */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }

          @media (min-width: 640px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 1024px) {
            .stats-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }

          .stat-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s;
          }

          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          }

          .stat-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .stat-numbers {
            flex: 1;
          }

          .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 4px 0;
          }

          .stat-label {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }

          .stat-icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .stat-icon-wrapper.green {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
          }

          .stat-icon-wrapper.blue {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
          }

          .stat-icon-wrapper.yellow {
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
          }

          .stat-icon-wrapper.purple {
            background: rgba(139, 92, 246, 0.1);
            color: #8b5cf6;
          }

          /* Error Alert */
          .error-alert {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .error-alert-content {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .error-icon {
            color: #dc2626;
            font-size: 20px;
          }

          .error-text {
            flex: 1;
            color: #991b1b;
            font-weight: 500;
          }

          .retry-btn {
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
            cursor: pointer;
          }

          .retry-btn:hover {
            background: #2563eb;
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

          /* Dashboard Grid */
          .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
          }

          @media (min-width: 1024px) {
            .dashboard-grid {
              grid-template-columns: 2fr 1fr;
            }
          }

          /* Card Styles */
          .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .card-header {
            padding: 24px;
            border-bottom: 1px solid rgba(229, 231, 235, 0.5);
          }

          .card-header h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
          }

          .card-header p {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
          }

          /* Agents Section */
          .agents-section .card-header {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .refresh-btn {
            align-self: flex-start;
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
          }

          .refresh-btn:hover {
            background: #e5e7eb;
          }

          .empty-state {
            padding: 60px 20px;
            text-align: center;
            color: #6b7280;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .empty-state h3 {
            margin: 0 0 8px 0;
            color: #374151;
          }

          .empty-state p {
            margin: 0;
            font-size: 14px;
          }

          .agents-list {
            padding: 16px;
          }

          .agent-item {
            padding: 16px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 8px;
            border: 1px solid transparent;
          }

          .agent-item:hover {
            background: rgba(243, 244, 246, 0.8);
          }

          .agent-item.selected {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.2);
          }

          .agent-info {
            display: flex;
            gap: 16px;
          }

          .agent-avatar {
            position: relative;
            flex-shrink: 0;
          }

          .avatar-circle {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
          }

          .status-dot {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
          }

          .status-dot.available {
            background: #10b981;
          }

          .status-dot.on-mission {
            background: #f59e0b;
          }

          .agent-details {
            flex: 1;
          }

          .agent-details h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 500;
            color: #1f2937;
          }

          .agent-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 8px;
          }

          .status-tag {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }

          .status-tag.available {
            background: rgba(16, 185, 129, 0.1);
            color: #065f46;
          }

          .status-tag.on-mission {
            background: rgba(245, 158, 11, 0.1);
            color: #92400e;
          }

          .role-tag {
            background: #f3f4f6;
            color: #6b7280;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
          }

          .matricule-tag {
            background: #f9fafb;
            color: #9ca3af;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-family: monospace;
          }

          .contact-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            font-size: 12px;
            color: #6b7280;
          }

          .agent-actions {
            display: flex;
            gap: 8px;
          }

          .icon-btn {
            width: 36px;
            height: 36px;
            border: 1px solid #e5e7eb;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .icon-btn:hover {
            background: #f3f4f6;
            transform: translateY(-1px);
          }

          /* Tours Section */
          .tours-section {
            margin-top: 24px;
          }

          .tours-list {
            padding: 24px;
          }

          .tour-item {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
          }

          .tour-header {
            margin-bottom: 16px;
          }

          .tour-header h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            font-weight: 500;
            color: #1f2937;
          }

          .tour-stats {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          @media (min-width: 640px) {
            .tour-stats {
              flex-direction: row;
              gap: 20px;
            }
          }

          .tour-stats span {
            font-size: 14px;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .tour-footer {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          @media (min-width: 768px) {
            .tour-footer {
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
            }
          }

          .progress-section {
            flex: 1;
          }

          .progress-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            color: #6b7280;
          }

          .progress-bar {
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            border-radius: 3px;
          }

          .progress-fill.complete {
            background: #10b981;
          }

          .progress-fill.good {
            background: #3b82f6;
          }

          .progress-fill.average {
            background: #f59e0b;
          }

          .details-btn {
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 20px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
          }

          .details-btn:hover {
            background: #2563eb;
          }

          /* Actions Section - MODIFIÉ ICI */
          .actions-list {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .action-btn {
            padding: 18px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 16px;
            font-weight: 500;
            color: white;
            transition: all 0.2s;
          }

          .action-btn:hover {
            transform: translateY(-2px);
          }

          .action-btn.blue {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
          }

          .action-btn.green {
            background: linear-gradient(135deg, #10b981, #059669);
          }

          .action-btn.purple {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          }

          .action-btn.yellow {
            background: linear-gradient(135deg, #f59e0b, #d97706);
          }

          .action-btn span:first-child {
            font-size: 24px;
          }

          /* Agent Details Section */
          .agent-detail-content {
            padding: 24px;
          }

          .agent-profile {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
          }

          .profile-avatar {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
            flex-shrink: 0;
          }

          .profile-info h3 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 500;
            color: #1f2937;
          }

          .profile-contact {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 14px;
            color: #6b7280;
          }

          .agent-stats-details {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
          }

          .stat-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
          }

          .stat-row span:first-child {
            color: #6b7280;
          }

          .stat-row span:last-child {
            color: #1f2937;
            font-weight: 500;
          }

          .status.available {
            color: #10b981;
          }

          .status.on-mission {
            color: #f59e0b;
          }

          .role {
            color: #3b82f6;
          }

          .agent-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .secondary-btn {
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
          }

          .secondary-btn.blue {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
          }

          .secondary-btn.blue:hover {
            background: rgba(59, 130, 246, 0.2);
          }

          .secondary-btn.green {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
          }

          .secondary-btn.green:hover {
            background: rgba(16, 185, 129, 0.2);
          }

          /* Performance Section */
          .performance-content {
            padding: 24px;
          }

          .performance-item {
            margin-bottom: 20px;
          }

          .performance-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            color: #6b7280;
          }

          .performance-bar {
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            overflow: hidden;
          }

          .performance-fill {
            height: 100%;
            border-radius: 3px;
          }

          .performance-fill.green {
            background: #10b981;
          }

          .performance-fill.blue {
            background: #3b82f6;
          }

          .performance-fill.purple {
            background: #8b5cf6;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Responsive */
          @media (max-width: 768px) {
            .chef-equipe-container {
              padding: 16px;
            }

            .page-title {
              font-size: 24px;
            }

            .page-subtitle {
              font-size: 14px;
            }

            .agent-info {
              flex-direction: column;
            }

            .agent-actions {
              align-self: flex-end;
            }

            .tour-footer {
              flex-direction: column;
            }

            .details-btn {
              align-self: flex-start;
            }
          }
        `}</style>
      </div>
    </RoleBasedLayout>
  );
}
