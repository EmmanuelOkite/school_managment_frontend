import api from './axios';

export const gradingScaleService = {
  create: (data: any) => api.post('/grading-scales', data),
  getAll: () => api.get('/grading-scales'),
  getOne: (id: string) => api.get(`/grading-scales/${id}`),
  update: (id: string, data: any) => api.patch(`/grading-scales/${id}`, data),
  delete: (id: string) => api.delete(`/grading-scales/${id}`),
  setDefault: (id: string) => api.post(`/grading-scales/${id}/set-default`),
};
