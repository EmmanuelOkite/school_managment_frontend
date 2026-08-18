import api from './axios';

export const streamService = {
  getForClass: (classId: string) => api.get('/streams', { params: { classId } }),
  bulkSave: (classId: string, streams: any[]) => api.put(`/classes/${classId}/streams`, { streams }),
  update: (id: string, data: any) => api.patch(`/streams/${id}`, data),
  delete: (id: string) => api.delete(`/streams/${id}`),
};
