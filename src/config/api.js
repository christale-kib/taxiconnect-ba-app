// URL de base de l'API backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Fonction utilitaire pour faire des appels API
 * @param {string} endpoint - Le endpoint à appeler (ex: 'auth/login')
 * @param {object} options - Options fetch (method, body, etc.)
 */
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}/${endpoint}`;
  
  // Récupérer le token JWT s'il existe
  const token = localStorage.getItem('token');
  
  // Configuration par défaut
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };

  console.log(`🌐 API Call: ${config.method} ${url}`);

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Erreur HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur API:', error);
    throw error;
  }
};

export default API_BASE_URL;