import api from './client'

export const masksApi = {
  async list() { return (await api.get('/api/masks')).data.masks },
  async get(id) { return (await api.get(`/api/masks/${id}`)).data.mask },
  async create(mask) { return (await api.post('/api/masks', mask)).data },
  async chat(id, payload) { return (await api.post(`/api/masks/${id}/chat`, payload)).data },
}
