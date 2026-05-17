import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = (process.env.BACKEND_URL || 'http://10.0.2.2:8000') + '/api/v1';

export const apiClient = axios.create({ baseURL: BACKEND_URL });

apiClient.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error?.response?.status === 401) {
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
      // NavigationRef would be used here for redirect; screens handle 401 via re-render
    }
    if (!error.response && !error.config?._retried) {
      error.config._retried = true;
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  },
);

/**
 * Generic multipart file upload. Handles both image (disease) and audio (pest) uploads.
 * fieldName defaults to 'image'; pass 'audio' for pest detection.
 */
export const uploadFile = async (
  endpoint: string,
  fileUri: string,
  extraFields: Record<string, string | number>,
  fieldName: 'image' | 'audio' = 'image',
) => {
  const mimeType = fieldName === 'audio' ? 'audio/wav' : 'image/jpeg';
  const fileName = fieldName === 'audio' ? 'recording.wav' : 'capture.jpg';

  const data = new FormData();
  data.append(fieldName, { uri: fileUri, type: mimeType, name: fileName } as any);
  Object.entries(extraFields).forEach(([k, v]) => data.append(k, String(v)));

  return apiClient.post(endpoint, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
