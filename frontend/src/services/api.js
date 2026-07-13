import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach auth and mock headers
API.interceptors.request.use(
  (config) => {
    // 1. Attach Firebase ID Token if logged in
    const token = localStorage.getItem('sibis_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Attach Mock User Headers (for developer offline mode)
    const mockUid = localStorage.getItem('sibis_mock_uid');
    const mockRole = localStorage.getItem('sibis_mock_role');
    const mockEmail = localStorage.getItem('sibis_mock_email');
    const mockName = localStorage.getItem('sibis_mock_name');

    if (mockUid) {
      config.headers['x-mock-uid'] = mockUid;
    }
    if (mockRole) {
      config.headers['x-mock-role'] = mockRole;
    }
    if (mockEmail) {
      config.headers['x-mock-email'] = mockEmail;
    }
    if (mockName) {
      config.headers['x-mock-name'] = mockName;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
