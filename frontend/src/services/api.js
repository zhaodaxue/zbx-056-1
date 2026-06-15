const API_BASE = '/api'

let _backendAlive = null

export function isBackendAlive() {
  return _backendAlive
}

async function request(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    _backendAlive = true

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      _backendAlive = false
      throw new Error('无法连接到服务器，请检查后端服务是否已启动')
    }
    throw err
  }
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
