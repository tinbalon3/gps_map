import axios from 'axios';
import { RouteRequest, RouteResponse } from './types';

const API_URL = 'http://localhost:8000';

export const RoutingService = {
  getRoute: async (end: [number, number]): Promise<RouteResponse> => {
    const request: RouteRequest = {
      destination_location: {
        latitude: end[0],
        longitude: end[1]
      }
    };

    try {
      const response = await axios.post<RouteResponse>(`${API_URL}/route`, request);
      return response.data;
    } catch (error) {
      console.error('Error calculating route:', error);
      return {
        status: 'error',
        error: 'Failed to calculate route'
      };
    }
  }
};