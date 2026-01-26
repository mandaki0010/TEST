import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Employee API
export const employeeApi = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getStatistics: () => api.get('/employees/statistics'),
  getMyInfo: () => api.get('/employees/me'),
  updateMyInfo: (data) => api.put('/employees/me', data),
};

// Master data API
export const masterApi = {
  getDepartments: () => api.get('/master/departments'),
  getDepartmentHierarchy: () => api.get('/master/departments/hierarchy'),
  getPositions: () => api.get('/master/positions'),
  getEmploymentTypes: () => api.get('/master/employment-types'),
  createDepartment: (data) => api.post('/master/departments', data),
  updateDepartment: (id, data) => api.put(`/master/departments/${id}`, data),
  getOperationLogs: (limit) => api.get('/master/logs', { params: { limit } }),
};

// Import API
export const importApi = {
  getTemplate: () => api.get('/import/template', { responseType: 'blob' }),
  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Report API
export const reportApi = {
  exportEmployeeListExcel: (params) =>
    api.get('/reports/employees/excel', { params, responseType: 'blob' }),
  exportEmployeeListPDF: (params) =>
    api.get('/reports/employees/pdf', { params, responseType: 'blob' }),
  exportDepartmentListExcel: () =>
    api.get('/reports/departments/excel', { responseType: 'blob' }),
  exportOrganizationChartPDF: () =>
    api.get('/reports/organization/pdf', { responseType: 'blob' }),
  exportActiveEmployeesExcel: () =>
    api.get('/reports/active/excel', { responseType: 'blob' }),
};

export default api;
