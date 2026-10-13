import api from './client'

export const groupsApi = {
  async list() { return (await api.get('/api/groups')).data.groups },
  async create(payload) { return (await api.post('/api/groups', payload)).data.group },
  async messages(id) { return (await api.get(`/api/groups/${id}/messages`)).data.messages },
  async members(id) { return (await api.get(`/api/groups/${id}/members`)).data.members },
  async send(id, message) { return (await api.post(`/api/groups/${id}/messages`, { message })).data.messages },
  async remove(id) { return (await api.delete(`/api/groups/${id}`)).data },
}
