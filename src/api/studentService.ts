import api from './axios';

export const studentService = {
  create: (data: any) => api.post('/students', data),
  getAll: () => api.get('/students'),
  getOne: (id: string) => api.get(`/students/${id}`),
  update: (id: string, data: any) => api.patch(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
};