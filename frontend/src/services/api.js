import axios from 'axios';

/**
 * Base URL resolution order:
 *  1. VITE_API_URL env variable (set in Netlify UI or .env.local)
 *     e.g.  VITE_API_URL=https://tracefix-api.onrender.com
 *  2. Falls back to '/api' for local development where the Vite
 *     dev-server proxy forwards /api → http://localhost:8000
 */
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
});

export const getDashboardStats = () => api.get('/dashboard/stats').then(res => res.data);
export const getRecentActivity = () => api.get('/dashboard/recent-activity').then(res => res.data);

export const getRepositories = () => api.get('/repositories').then(res => res.data);
export const uploadRepository = (formData) => api.post('/repositories/upload', formData).then(res => res.data);
export const getRepositoryTree = (repoId) => api.get(`/repositories/${repoId}/tree`).then(res => res.data);
export const getRepositoryFile = (repoId, filePath) => api.get(`/repositories/${repoId}/file`, { params: { file_path: filePath } }).then(res => res.data);

export const analyzeInvestigation = (payload) => api.post('/investigation/analyze', payload).then(res => res.data);

export const createSession = (payload) => api.post('/repair/sessions', payload).then(res => res.data);
export const listSessions = () => api.get('/repair/sessions').then(res => res.data);
export const getSessionDetails = (id) => api.get(`/repair/sessions/${id}`).then(res => res.data);
export const generatePatch = (payload) => api.post('/repair/generate-patch', payload).then(res => res.data);

export const runTestFirst = (payload) => api.post('/verification/test-first', payload).then(res => res.data);
export const verifyPatch = (payload) => api.post('/verification/verify-patch', payload).then(res => res.data);

export const getBenchmarkTasks = () => api.get('/benchmarks/tasks').then(res => res.data);
export const importBenchmarks = (payload) => api.post('/benchmarks/import', payload).then(res => res.data);

export const runExperiment = (payload) => api.post('/experiments/run', payload).then(res => res.data);
export const getExperimentHistory = () => api.get('/experiments/history').then(res => res.data);
export const exportExperimentsCsv = () => window.open(`${BASE_URL}/experiments/export/csv`, '_blank');

export const getLatestReport = () => api.get('/reports/latest').then(res => res.data);
export const downloadReport = (format) => window.open(`${BASE_URL}/reports/download/${format}`, '_blank');

export const getSettings = () => api.get('/settings').then(res => res.data);
export const updateSettings = (payload) => api.post('/settings', payload).then(res => res.data);

export default api;
