import api from './axios';

export const marksService = {
  getForExam: (examId: string) => api.get('/marks', { params: { examId } }),
  save: (data: any) => api.post('/marks', data),
  saveDraft: (data: any) => api.post('/marks/draft', data),
  submit: (data: any) => api.post('/marks/submit', data),
  publish: (data: any) => api.post('/marks/publish', data),
};
