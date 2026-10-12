import api from './client'

export const adminApi = {
  async users() { return (await api.get('/api/admin/users')).data.users },
  async deleteUser(id) { return (await api.delete(`/api/admin/users/${id}`)).data },
  async setPassword(id, password) { return (await api.put(`/api/admin/users/${id}/password`, { password })).data },
}
