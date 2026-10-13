import api from './client';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

export const dashboardApi = {
  get: () => api.get('/dashboard').then(r => r.data),
  resetDemo: () => api.post('/dashboard/reset-demo').then(r => r.data),
};

export const donorsApi = {
  list: (params?: any) => api.get('/donors', { params }).then(r => r.data),
  get: (id: string) => api.get(`/donors/${id}`).then(r => r.data),
  history: (id: string) => api.get(`/donors/${id}/history`).then(r => r.data),
  create: (data: any) => api.post('/donors', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/donors/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/donors/${id}`).then(r => r.data),
};

export const appointmentsApi = {
  list: (params?: any) => api.get('/appointments', { params }).then(r => r.data),
  get: (id: string) => api.get(`/appointments/${id}`).then(r => r.data),
  create: (data: any) => api.post('/appointments', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/appointments/${id}`, data).then(r => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/appointments/${id}/status`, { status }).then(r => r.data),
};

export const donationsApi = {
  list: (params?: any) => api.get('/donations', { params }).then(r => r.data),
  create: (data: any) => api.post('/donations', data).then(r => r.data),
};

export const inventoryApi = {
  list: () => api.get('/inventory').then(r => r.data),
  transactions: (params?: any) => api.get('/inventory/transactions', { params }).then(r => r.data),
  adjust: (data: any) => api.post('/inventory/adjust', data).then(r => r.data),
  setThreshold: (bloodGroup: string, min_threshold: number) =>
    api.patch(`/inventory/${encodeURIComponent(bloodGroup)}/threshold`, { min_threshold }).then(r => r.data),
};

export const hospitalsApi = {
  list: (params?: any) => api.get('/hospitals', { params }).then(r => r.data),
  get: (id: string) => api.get(`/hospitals/${id}`).then(r => r.data),
  create: (data: any) => api.post('/hospitals', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/hospitals/${id}`, data).then(r => r.data),
  toggleStatus: (id: string) => api.patch(`/hospitals/${id}/status`).then(r => r.data),
};

export const bloodRequestsApi = {
  list: (params?: any) => api.get('/blood-requests', { params }).then(r => r.data),
  get: (id: string) => api.get(`/blood-requests/${id}`).then(r => r.data),
  create: (data: any) => api.post('/blood-requests', data).then(r => r.data),
  updateStatus: (id: string, status: string, remarks?: string) =>
    api.patch(`/blood-requests/${id}/status`, { status, remarks }).then(r => r.data),
};

export const laboratoryApi = {
  list: (params?: any) => api.get('/laboratory', { params }).then(r => r.data),
  get: (id: string) => api.get(`/laboratory/${id}`).then(r => r.data),
  update: (id: string, data: any) => api.put(`/laboratory/${id}`, data).then(r => r.data),
};

export const notificationsApi = {
  list: (params?: any) => api.get('/notifications', { params }).then(r => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then(r => r.data),
};

export const reportsApi = {
  inventory: () => api.get('/reports/inventory').then(r => r.data),
  donors: (params?: any) => api.get('/reports/donors', { params }).then(r => r.data),
  donations: (params?: any) => api.get('/reports/donations', { params }).then(r => r.data),
  bloodRequests: (params?: any) => api.get('/reports/blood-requests', { params }).then(r => r.data),
  hospitals: () => api.get('/reports/hospitals').then(r => r.data),
  laboratory: (params?: any) => api.get('/reports/laboratory', { params }).then(r => r.data),
  appointments: (params?: any) => api.get('/reports/appointments', { params }).then(r => r.data),
  monthlyCollection: () => api.get('/reports/monthly-collection').then(r => r.data),
};

export const usersApi = {
  list: (params?: any) => api.get('/users', { params }).then(r => r.data),
  create: (data: any) => api.post('/users', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data).then(r => r.data),
  toggleStatus: (id: string) => api.patch(`/users/${id}/status`).then(r => r.data),
  resetPassword: (id: string, password: string) =>
    api.patch(`/users/${id}/reset-password`, { password }).then(r => r.data),
};

export const auditApi = {
  list: (params?: any) => api.get('/audit', { params }).then(r => r.data),
};
