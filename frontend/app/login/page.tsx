'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth-service';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Se connecter
      await authService.login({ username, password });

      // 2. Récupérer la route par défaut selon le rôle
      const defaultRoute = authService.getDefaultRoute();

      // 3. Rediriger
      router.push(defaultRoute);

    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Nom d\'utilisateur ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background effects */}
      <div className="background-circle top-right"></div>
      <div className="background-circle bottom-left"></div>

      <div className="main-content">
        {/* Logo Header */}
        <div className="logo-header">
          <div className="logo-wrapper">
            <span className="logo-icon">🗑️</span>
          </div>
          <h1 className="title">Gestion Municipale des Déchets</h1>
          <p className="subtitle">Système intelligent de collecte et de suivi</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          {/* Card Header */}
          <div className="card-header">
            <h2 className="card-title">Connexion au système</h2>
            <p className="card-subtitle">Accédez à votre espace personnel</p>
          </div>

          {/* Card Body */}
          <div className="card-body">
            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <div className="error-content">
                  <p className="error-text">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              {/* Username Field */}
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Nom d'utilisateur
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">👤</div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    placeholder="admin"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mot de passe
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">🔒</div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="form-options">
                <div className="remember-me">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="checkbox"
                  />
                  <label htmlFor="remember-me" className="checkbox-label">
                    Se souvenir de moi
                  </label>
                </div>
                <span className="forgot-password" title="Contactez un administrateur pour réinitialiser votre accès">
                  Mot de passe oublié ? Contactez votre administrateur.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span className="button-icon">🚀</span>
                    <span>Se connecter</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider-section">
              <div className="divider">
                <span className="divider-text">Nouveau sur la plateforme ?</span>
              </div>

              <p className="register-link-container" role="note">
                Le premier compte administrateur doit être créé avec le jeton de configuration du serveur.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="page-footer">
          <p className="footer-text">
            © {new Date().getFullYear()} Système Municipal de Gestion des Déchets
          </p>
          <p className="footer-version">
            Version 2.0 • Interface optimisée pour la présentation
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="feature-grid">
          {[
            { icon: '🗺️', title: 'Carte Interactive', desc: 'Suivi temps réel', color: '#3b82f6' },
            { icon: '🚚', title: 'Tournées IA', desc: 'Optimisation automatique', color: '#10b981' },
            { icon: '📊', title: 'Analytique Avancée', desc: 'Rapports détaillés', color: '#8b5cf6' }
          ].map((feature, index) => (
            <div key={index} className="feature-card">
              <div
                className="feature-icon-wrapper"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <span
                  className="feature-icon"
                  style={{ color: feature.color }}
                >
                  {feature.icon}
                </span>
              </div>
              <h4 className="feature-title">{feature.title}</h4>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f9ff 0%, #f0fff4 100%);
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
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
          max-width: 500px;
          width: 100%;
          z-index: 1;
        }

        /* Logo Header */
        .logo-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
          margin-bottom: 24px;
        }

        .logo-icon {
          font-size: 36px;
        }

        .title {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }

        .subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }

        /* Login Card */
        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          margin-bottom: 32px;
        }

        .card-header {
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
          padding: 24px 32px;
        }

        .card-title {
          font-size: 24px;
          font-weight: bold;
          color: white;
          margin: 0 0 4px 0;
        }

        .card-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          margin: 0;
        }

        .card-body {
          padding: 32px;
        }

        /* Error Message */
        .error-message {
          margin-bottom: 24px;
          padding: 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          display: flex;
          align-items: center;
        }

        .error-icon {
          flex-shrink: 0;
          color: #dc2626;
          font-size: 20px;
          margin-right: 12px;
        }

        .error-text {
          font-size: 14px;
          font-weight: 500;
          color: #991b1b;
          margin: 0;
        }

        /* Form Styles */
        .login-form {
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          padding-left: 12px;
          display: flex;
          align-items: center;
          pointer-events: none;
          color: #9ca3af;
          font-size: 18px;
        }

        .form-input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          font-size: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .remember-me {
          display: flex;
          align-items: center;
        }

        .checkbox {
          height: 16px;
          width: 16px;
          color: #3b82f6;
          border-color: #d1d5db;
          border-radius: 4px;
          cursor: pointer;
        }

        .checkbox-label {
          margin-left: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .forgot-password {
          font-size: 14px;
          font-weight: 500;
          color: #3b82f6;
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot-password:hover {
          color: #2563eb;
        }

        /* Submit Button */
        .submit-button {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 14px;
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
          font-size: 16px;
          font-weight: 500;
          color: white;
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          opacity: 1;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
        }

        .submit-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .button-icon {
          margin-right: 8px;
          font-size: 20px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Divider Section */
        .divider-section {
          margin-top: 32px;
        }

        .divider {
          position: relative;
          margin-bottom: 24px;
        }

        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          border-top: 1px solid #d1d5db;
        }

        .divider-text {
          position: relative;
          padding: 0 16px;
          background: white;
          font-size: 14px;
          color: #6b7280;
          display: inline-block;
          left: 50%;
          transform: translateX(-50%);
        }

        .register-link-container {
          text-align: center;
        }

        .register-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 14px;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          color: #3b82f6;
          background: white;
          text-decoration: none;
          transition: all 0.3s;
          gap: 8px;
        }

        .register-link:hover {
          background: #f8fafc;
          transform: translateY(-2px);
        }

        .register-icon {
          font-size: 20px;
        }

        /* Card Footer */
        .card-footer {
          background: #f9fafb;
          padding: 24px 32px;
          border-top: 1px solid #e5e7eb;
        }

        .demo-accounts {
          text-align: center;
        }

        .demo-title {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 16px 0;
        }

        .demo-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .demo-button {
          width: 100%;
          max-width: 300px;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .demo-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .demo-button.admin {
          background: #dbeafe;
        }

        .demo-button.agent {
          background: #d1fae5;
        }

        .demo-button.chef {
          background: #fef3c7;
        }

        .demo-role {
          font-weight: 500;
        }

        .demo-button.admin .demo-role {
          color: #1e40af;
        }

        .demo-button.agent .demo-role {
          color: #065f46;
        }

        .demo-button.chef .demo-role {
          color: #92400e;
        }

        .demo-credentials {
          font-size: 12px;
          color: #4b5563;
        }

        /* Page Footer */
        .page-footer {
          margin-top: 32px;
          text-align: center;
        }

        .footer-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 4px 0;
        }

        .footer-version {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        /* Feature Grid */
        .feature-grid {
          margin-top: 40px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-2px);
        }

        .feature-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
        }

        .feature-icon {
          font-size: 20px;
        }

        .feature-title {
          font-weight: 500;
          color: #1f2937;
          margin: 0 0 4px 0;
          font-size: 14px;
        }

        .feature-desc {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .title {
            font-size: 24px;
          }

          .subtitle {
            font-size: 14px;
          }

          .card-body {
            padding: 24px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .demo-buttons {
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}
