import { defineStore } from 'pinia';
import { api } from './api.js';

export const useSessionStore = defineStore('session', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  getters: {
    isLogin: (state) => Boolean(state.user),
    isAdmin: (state) => state.user?.role === 'admin'
  },
  actions: {
    async login(form) {
      const data = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      this.user = data.user;
    },
    async register(form) {
      const data = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      this.user = data.user;
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.user = null;
    }
  }
});
