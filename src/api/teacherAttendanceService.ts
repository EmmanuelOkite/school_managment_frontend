import api from './axios';

export const teacherAttendanceService = {
  getForDate: (params: { date: string; department?: string; session?: string }) =>
    api.get('/teacher-attendance', { params }),
  submit: (data: any) => api.post('/teacher-attendance', data),
  saveDraft: (data: any) => api.post('/teacher-attendance/draft', data),
};
