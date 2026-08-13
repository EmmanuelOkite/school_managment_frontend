import api from './axios';

export const gradeRuleService = {
  getForScale: (gradingScaleId: string) => api.get('/grade-rules', { params: { gradingScaleId } }),
  bulkSave: (gradingScaleId: string, rules: any[]) => api.put(`/grading-scales/${gradingScaleId}/rules`, { rules }),
  update: (id: string, data: any) => api.patch(`/grade-rules/${id}`, data),
  delete: (id: string) => api.delete(`/grade-rules/${id}`),
};
