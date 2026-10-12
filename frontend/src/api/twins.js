import api from './client'

export const twinsApi = {
  async list() { return (await api.get('/api/twins')).data.twins },
  async save(maskId) { return (await api.post(`/api/twins/${maskId}`)).data },
  async remove(maskId) { return (await api.delete(`/api/twins/${maskId}`)).data },
}
