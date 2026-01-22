import { apiCall } from '../config/api';

export const chauffeurService = {
  /**
   * Enrôler un nouveau chauffeur
   */
  enrollDriver: async (driverData) => {
    try {
      const data = await apiCall('chauffeurs/enroll', {
        method: 'POST',
        body: JSON.stringify(driverData)
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Récupérer la liste des chauffeurs du BA
   */
  getDrivers: async () => {
    try {
      const data = await apiCall('chauffeurs', {
        method: 'GET'
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Récupérer les détails d'un chauffeur
   */
  getDriverById: async (id) => {
    try {
      const data = await apiCall(`chauffeurs/${id}`, {
        method: 'GET'
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
};