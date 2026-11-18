// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          color: '#2c3e50',
          fontSize: '2.5rem',
          marginBottom: '10px'
        }}>
          🗑️ Système Intelligent de Gestion des Déchets
        </h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
          Projet 2ème année ING – GL | Optimisation des tournées de collecte
        </p>
      </header>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '30px',
        borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#2c3e50', marginTop: 0 }}>🎯 Fonctionnalités</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ <strong>Carte interactive</strong> avec Leaflet/OpenStreetMap</li>
          <li>✅ <strong>Points de collecte</strong> géolocalisés</li>
          <li>✅ <strong>Niveaux de remplissage</strong> en temps réel</li>
          <li>✅ <strong>Algorithmes d'optimisation</strong> (Dijkstra)</li>
          <li>✅ <strong>Dashboard</strong> avec statistiques</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link href="/map" style={{
          display: 'inline-block',
          padding: '15px 40px',
          backgroundColor: '#3498db',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
        }}>
          🗺️ Accéder à la Carte Interactive
        </Link>

        <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
          Cliquez pour visualiser tous les points de collecte sur la carte
        </p>
      </div>

      <footer style={{
        textAlign: 'center',
        padding: '30px 0',
        borderTop: '1px solid #eee',
        marginTop: '50px',
        color: '#95a5a6'
      }}>
        <p>
          <strong>Stack technique :</strong> Next.js 14 • Spring Boot • MongoDB
        </p>
        <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
          Développé pour le module "Bases de données Massives et J2EE"
        </p>
      </footer>
    </div>
  );
}
