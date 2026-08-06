import api from './axios';

export const announcementService = {
  create: (data: any) => api.post('/announcements', data),
  getAll: () => api.get('/announcements'),
  getOne: (id: string) => api.get(`/announcements/${id}`),
  update: (id: string, data: any) => api.patch(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};
