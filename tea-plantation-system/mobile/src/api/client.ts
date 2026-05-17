import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = axios.create({ baseURL: process.env.BACKEND_URL || 'http://localhost:8000' });

client.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  r => r,
  async err => {
    if (err?.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    if (!err.response && !err.config._retried) {
      err.config._retried = true;
      return client.request(err.config);
    }
    return Promise.reject(err);
  },
);

export const uploadFile = async (endpoint: string, fileUri: string, extraFields: Record<string, string>) => {
  const data = new FormData();
  data.append('image', { uri: fileUri, type: 'image/jpeg', name: 'upload.jpg' } as any);
  Object.entries(extraFields).forEach(([k, v]) => data.append(k, v));
  return client.post(endpoint, data, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export default client;
