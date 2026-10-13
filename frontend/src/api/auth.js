import api from './client'

export const authApi = {
  async login(credentials) { return (await api.post('/api/auth/login', credentials)).data },
  async register(details) { return (await api.post('/api/auth/register', details)).data },
  async me() { return (await api.get('/api/auth/me')).data },
  async updateProfile(profile) { return (await api.put('/api/auth/profile', profile)).data },
  async logout() { return (await api.post('/api/auth/logout')).data },
}
