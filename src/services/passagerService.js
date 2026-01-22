import { apiCall } from '../config/api';

export const passagerService = {
  /**
   * Enrôler un nouveau passager
   */
  enrollPassenger: async (passengerData) => {
    try {
      const data = await apiCall('passagers/enroll', {
        method: 'POST',
        body: JSON.stringify(passengerData)
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Récupérer la liste des passagers du BA
   */
  getPassengers: async () => {
    try {
      const data = await apiCall('passagers', {
        method: 'GET'
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Récupérer les détails d'un passager
   */
  getPassengerById: async (id) => {
    try {
      const data = await apiCall(`passagers/${id}`, {
        method: 'GET'
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
};