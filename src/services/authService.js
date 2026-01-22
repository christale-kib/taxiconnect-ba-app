import { apiCall } from '../config/api';

export const authService = {
  /**
   * Inscription d'un nouveau Brand Ambassador
   */
  register: async (userData) => {
    try {
      const data = await apiCall('auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      // Stocker le token et les infos utilisateur
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Connexion d'un BA existant
   */
  login: async (credentials) => {
    try {
      const data = await apiCall('auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      // Stocker le token et les infos utilisateur
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Déconnexion
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Récupérer l'utilisateur connecté
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Récupérer le profil complet du BA
   */
  getProfile: async () => {
    try {
      const data = await apiCall('auth/profile', {
        method: 'GET'
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
};