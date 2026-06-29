import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL) || 'http://10.0.0.1:3000';

export const api = axios.create({ baseURL: BASE_URL, timeout: 8000 });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: {
    name: string;
    email: string;
    password: string;
    school: string;
    class?: string;
    role?: 'student' | 'teacher';
  }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const roomsApi = {
  getAll: () => api.get('/rooms'),
  getById: (id: string) => api.get(`/rooms/${id}`),
};

export const lessonsApi = {
  getByRoom: (roomId: string) => api.get(`/rooms/${roomId}/lessons`),
  getById: (id: string) => api.get(`/lessons/${id}`),
};

export const casesApi = {
  getByLesson: (lessonId: string) => api.get(`/lessons/${lessonId}/cases`),
  getById: (id: string) => api.get(`/cases/${id}`),
  submitVerdict: (caseId: string, verdict: string, reasoning: string) =>
    api.post(`/cases/${caseId}/verdict`, { verdict, reasoning }),
};

export const progressApi = {
  getAll: () => api.get('/progress'),
  update: (roomId: string, data: object) =>
    api.post(`/progress/${roomId}`, data),
};

export const achievementsApi = {
  getAll: () => api.get('/achievements'),
  getUserAchievements: () => api.get('/achievements/me'),
};

export const aiApi = {
  ask: (question: string, context: string) =>
    api.post('/ai/ask', { question, context }),
};
