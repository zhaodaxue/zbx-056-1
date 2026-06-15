const API_BASE = '/api'

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  getConfig: () => request('/config'),

  getHealth: () => request('/health'),

  validatePoints: (points, blastCenter, buildings) =>
    request('/snapshots/validate', {
      method: 'POST',
      body: JSON.stringify({ points, blastCenter, buildings })
    }),

  createSnapshot: (data) =>
    request('/snapshots', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getSnapshots: () => request('/snapshots'),

  getSnapshot: (id) => request(`/snapshots/${id}`),

  deleteSnapshot: (id) =>
    request(`/snapshots/${id}`, {
      method: 'DELETE'
    })
}
