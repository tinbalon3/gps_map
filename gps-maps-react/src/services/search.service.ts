import axios from 'axios';
import { SearchResponse } from './types';

const API_URL = 'http://localhost:8000';

export const SearchService = {
  searchLocation: async (request: {
    query: string;
  }): Promise<SearchResponse> => {
    try {
      const response = await axios.post<SearchResponse>(`${API_URL}/search`, request);
      return response.data;
    } catch (error) {
      console.error('Error searching location:', error);
      return {
        status: 'error',
        error: 'Failed to search location'
      };
    }
  }
};