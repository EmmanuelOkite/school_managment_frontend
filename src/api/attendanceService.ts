import api from './axios';

export const attendanceService = {
  getForDate: (params: { date: string; classId: string; stream?: string; subject?: string; session?: string }) =>
    api.get('/attendance', { params }),
  submit: (data: any) => api.post('/attendance', data),
  saveDraft: (data: any) => api.post('/attendance/draft', data),
};
