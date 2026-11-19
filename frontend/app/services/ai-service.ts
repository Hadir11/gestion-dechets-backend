// frontend/app/services/ai-service.ts

import { API_BASE_URL } from './api-base';

export interface TourneeIA {
  _id?: string;
  date: string;
  heureDepart: string;
  vehicule: any;
  status: string;
  dureeEstimee: number;
  pointsCollecte: any[];
}

export interface PredictionIA {
  point_id: string;
  heures_dans_futur: number;
  prediction_niveau: number;
  unite: string;
  message: string;
}

export async function optimiserAvecIA(zoneId: string): Promise<{
  success: boolean;
  algorithme: string;
  description: string;
  tournees: TourneeIA[];
  tournees_generes: number;
}> {
  try {

    const response = await fetch(`${API_BASE_URL}/ia/optimiser?zoneId=${zoneId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur API IA: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('❌ Erreur optimisation IA:', error);
    throw error;
  }
}

export async function predireRemplissageIA(pointId: string, heures: number = 6): Promise<PredictionIA> {
  try {
    const response = await fetch(`${API_BASE_URL}/ia/predire/${pointId}?heures=${heures}`);

    if (!response.ok) {
      throw new Error(`Erreur prédiction IA: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('❌ Erreur prédiction IA:', error);
    throw error;
  }
}

