import api from './axios';

export const examService = {
  create: (data: any) => api.post('/exams', data),
  getAll: () => api.get('/exams'),
  getOne: (id: string) => api.get(`/exams/${id}`),
  update: (id: string, data: any) => api.patch(`/exams/${id}`, data),
  delete: (id: string) => api.delete(`/exams/${id}`),
};
