import apiClient from './api';

export interface ItineraryRequest {
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  people_count: number;
  preferences?: string;
}

export interface ItineraryResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const plannerService = {
  // Generate new itinerary
  async generateItinerary(data: ItineraryRequest): Promise<ItineraryResponse> {
    try {
      const response = await apiClient.post('/itinerary/generate', data);
      // The response is already the data due to axios interceptor
      return response;
    } catch (error: any) {
      console.error('Generate itinerary error:', error);
      // Return error response
      return {
        success: false,
        error: error.response?.data?.error || error.message || '生成行程失败，请重试'
      };
    }
  },

  // Get itinerary by ID
  async getItinerary(id: string): Promise<ItineraryResponse> {
    return apiClient.get(`/itinerary/${id}`);
  },

  // Update itinerary
  async updateItinerary(id: string, data: any): Promise<ItineraryResponse> {
    return apiClient.put(`/itinerary/${id}`, data);
  },

  // Delete itinerary
  async deleteItinerary(id: string): Promise<ItineraryResponse> {
    return apiClient.delete(`/itinerary/${id}`);
  },

  // Transcribe audio to text
  async transcribeAudio(audioData: FormData): Promise<string> {
    const response = await apiClient.post('/voice/transcribe', audioData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.transcription;
  },

  // Get destination insights
  async getDestinationInsights(destination: string): Promise<any> {
    return apiClient.get(`/insights/${destination}`);
  },
};