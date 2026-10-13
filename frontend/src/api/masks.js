import api from './client'

export const masksApi = {
  async list() { return (await api.get('/api/masks')).data.masks },
  async get(id, options = {}) { return (await api.get(`/api/masks/${id}`, { suppressErrorToast: options.suppressErrorToast })).data.mask },
  async create(mask) { return (await api.post('/api/masks', mask)).data },
  async update(id, mask) { return (await api.put(`/api/admin/masks/${id}`, mask)).data },
  async remove(id) { return (await api.delete(`/api/admin/masks/${id}`)).data },
  async chat(id, payload) { return (await api.post(`/api/masks/${id}/chat`, payload)).data },
}
