import api from './axios';

export const teacherService = {
  create: (data: any) => api.post('/teachers', data),
  getAll: () => api.get('/teachers'),
  getOne: (id: string) => api.get(`/teachers/${id}`),
  update: (id: string, data: any) => api.patch(`/teachers/${id}`, data),
  delete: (id: string) => api.delete(`/teachers/${id}`),
};
