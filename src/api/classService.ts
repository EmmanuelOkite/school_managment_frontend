import api from './axios';

export const classService = {
  create: (data: any) => api.post('/classes', data),
  getAll: () => api.get('/classes'),
  getOne: (id: string) => api.get(`/classes/${id}`),
  update: (id: string, data: any) => api.patch(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
};
