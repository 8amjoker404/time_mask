import api from './client'

export const conversationsApi = {
  async list() { return (await api.get('/api/conversations')).data.conversations },
  async messages(id) { return (await api.get(`/api/conversations/${id}/messages`)).data.messages },
  async byMask(maskId) { return (await api.get(`/api/conversations/by-mask/${maskId}`)).data },
}
