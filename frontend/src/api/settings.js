import api from './client'

export const settingsApi = {
  async getLlm() { return (await api.get('/api/settings/llm')).data },
  async setGoogleKey(apiKey) { return (await api.put('/api/settings/llm', { apiKey })).data },
}
