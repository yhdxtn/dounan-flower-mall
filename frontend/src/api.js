import axios from 'axios';
import { ElMessage } from 'element-plus';

export const api = axios.create({
  baseURL: '/api',
  timeout: 90000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.code === 'ECONNABORTED'
      ? 'AI 回复时间较长，请稍后再看或重新发送。'
      : error.response?.data?.message || '请求失败';
    ElMessage.error(message);
    return Promise.reject(error);
  }
);
