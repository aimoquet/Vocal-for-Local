import axios from 'axios';

// Use same-origin proxy '/api' by default, or fallback to explicit URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export interface AnalysisResponse {
  analysis_id: string;
  prediction: string;
  real_probability: number;
  fake_probability: number;
  confidence: number;
  risk_level: string;
  model_version: string;
  features: {
    mfcc: number[];
    spectral_centroid: number;
    spectral_bandwidth: number;
    spectral_rolloff: number;
    zero_crossing_rate: number;
    rms_energy: number;
  };
  duration: number;
}

export const analyzeAudio = async (file: File): Promise<AnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getHistory = async () => {
  const response = await api.get('/history');
  return response.data;
};

export const getAnalysis = async (id: string) => {
  const response = await api.get(`/history/${id}`);
  return response.data;
};

export const getModelInfo = async () => {
  const response = await api.get('/model-info');
  return response.data;
};
