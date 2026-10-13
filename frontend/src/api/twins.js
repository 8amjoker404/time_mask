import api from './client'

export const twinsApi = {
  async list(options = {}) { return (await api.get('/api/twins', { suppressErrorToast: options.suppressErrorToast })).data.twins },
  async save(maskId) { return (await api.post(`/api/twins/${maskId}`)).data },
  async createCustom(data) { return (await api.post('/api/twins/custom', data)).data },
  async remove(maskId) { return (await api.delete(`/api/twins/${maskId}`)).data },
  async interview(maskId) { return (await api.get(`/api/twins/${maskId}/interview`)).data },
  async saveInterview(maskId, answers, completed) {
    return (await api.post(`/api/twins/${maskId}/interview`, { answers, completed })).data
  },
}
