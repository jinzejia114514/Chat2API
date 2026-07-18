/**
 * HTTP API 客户端 - 替代 Electron IPC 的 window.electronAPI
 * 保持相同的 API 形状，底层使用 fetch
 */

const TOKEN_KEY = 'chat2api_token'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const resp = await fetch(path, { ...options, headers })
  if (resp.status === 401) {
    clearToken()
    if (!window.location.pathname.includes('/login')) {
      window.location.hash = '#/login'
    }
    throw new Error('Unauthorized')
  }
  return resp.json()
}

// ===== API 客户端（与 electronAPI 保持同形） =====

export const api = {
  // 认证
  auth: {
    setup: (password: string) => apiFetch('/api/auth/setup', { method: 'POST', body: JSON.stringify({ password }) }),
    login: async (password: string) => {
      const res = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) })
      if (res.success && res.data?.token) setToken(res.data.token)
      return res
    },
    checkSetup: () => apiFetch('/api/auth/setup'),
    logout: () => { clearToken(); window.location.hash = '#/login' },
  },

  // Proxy
  proxy: {
    getStatus: () => apiFetch('/api/proxy/status').then(r => r.data),
    start: (port?: number) => apiFetch('/api/proxy/start', { method: 'POST', body: JSON.stringify({ port }) }),
    stop: () => apiFetch('/api/proxy/stop', { method: 'POST' }),
    getStatistics: () => apiFetch('/api/proxy/statistics').then(r => r.data),
    onStatusChanged: (_cb: any) => () => {},
  },

  // Config
  config: {
    get: () => apiFetch('/api/config').then(r => r.data),
    update: (updates: any) => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify(updates) }).then(r => r.data),
    onConfigChanged: (_cb: any) => () => {},
  },

  // Providers
  providers: {
    getAll: () => apiFetch('/api/providers').then(r => r.data),
    getBuiltin: () => apiFetch('/api/providers/builtin').then(r => r.data),
    getById: (id: string) => apiFetch(`/api/providers/${id}`).then(r => r.data),
    add: (data: any) => apiFetch('/api/providers', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    update: (id: string, data: any) => apiFetch(`/api/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(r => r.data),
    delete: (id: string) => apiFetch(`/api/providers/${id}`, { method: 'DELETE' }),
    checkAllStatus: () => Promise.resolve({}),
    duplicate: (id: string) => apiFetch(`/api/providers/${id}`).then(r => r.data),
    export: (id: string) => apiFetch(`/api/providers/${id}`).then(r => r.data),
    import: (data: string) => apiFetch('/api/providers', { method: 'POST', body: data }).then(r => r.data),
  },

  // Accounts
  accounts: {
    getAll: (includeCredentials?: boolean) => apiFetch(`/api/accounts${includeCredentials ? '?credentials=true' : ''}`).then(r => r.data),
    getById: (id: string, includeCredentials?: boolean) => apiFetch(`/api/accounts/${id}${includeCredentials ? '?credentials=true' : ''}`).then(r => r.data),
    add: (data: any) => apiFetch('/api/accounts', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    update: (id: string, data: any) => apiFetch(`/api/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(r => r.data),
    delete: (id: string) => apiFetch(`/api/accounts/${id}`, { method: 'DELETE' }),
  },

  // Logs
  logs: {
    get: (filter?: any) => apiFetch('/api/logs').then(r => r.data),
    clear: () => apiFetch('/api/logs', { method: 'DELETE' }),
    getStats: () => apiFetch('/api/logs/stats').then(r => r.data),
    getTrend: (days?: number) => apiFetch('/api/logs').then(r => r.data),
    export: () => apiFetch('/api/logs').then(r => r.data),
  },

  // Request Logs
  requestLogs: {
    get: (filter?: any) => apiFetch('/api/request-logs').then(r => r.data),
    clear: () => apiFetch('/api/request-logs', { method: 'DELETE' }),
    getStats: () => apiFetch('/api/logs/stats').then(r => r.data),
    getTrend: (days?: number) => apiFetch('/api/request-logs').then(r => r.data),
  },

  // Statistics
  statistics: {
    get: () => apiFetch('/api/statistics').then(r => r.data),
    getToday: () => apiFetch('/api/statistics/today').then(r => r.data),
  },

  // Sessions
  session: {
    getAll: () => apiFetch('/api/sessions').then(r => r.data),
    delete: (id: string) => apiFetch(`/api/sessions/${id}`, { method: 'DELETE' }),
    clearAll: () => apiFetch('/api/sessions', { method: 'DELETE' }),
    getConfig: () => apiFetch('/api/config').then(r => r.data?.sessionConfig),
    updateConfig: (cfg: any) => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify({ sessionConfig: cfg }) }),
  },

  // Prompts
  prompts: {
    getAll: () => apiFetch('/api/prompts').then(r => r.data),
    getBuiltin: () => apiFetch('/api/prompts').then(r => r.data),
    add: (data: any) => apiFetch('/api/prompts', { method: 'POST', body: JSON.stringify(data) }).then(r => r.data),
    update: (id: string, data: any) => apiFetch(`/api/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(r => r.data),
    delete: (id: string) => apiFetch(`/api/prompts/${id}`, { method: 'DELETE' }),
  },

  // App
  app: {
    getVersion: () => apiFetch('/api/version').then(r => r.data?.version),
  },

  // 通用 invoke / send / on（兼容用）
  invoke: (channel: string, ..._args: any[]) => {
    console.warn(`[API] invoke('${channel}') is deprecated`)
    return Promise.resolve(null)
  },
  send: (channel: string, ..._args: any[]) => {
    console.warn(`[API] send('${channel}') is deprecated`)
  },
  on: (_channel: string, _cb: any) => {
    return () => {}
  },

  // Tray（Web 版不支持，返回空操作）
  tray: {
    openDashboard: () => {},
    setHeight: () => {},
    quitApp: () => {},
  },

  // Management API / Context Management / OAuth / Tool Calling
  managementApi: {
    getConfig: () => apiFetch('/api/config').then(r => r.data?.managementApi),
    updateConfig: (cfg: any) => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify({ managementApi: cfg }) }),
    generateSecret: () => Promise.resolve(''),
  },

  contextManagement: {
    getConfig: () => apiFetch('/api/config').then(r => r.data?.contextManagement),
    updateConfig: (cfg: any) => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify({ contextManagement: cfg }) }),
  },

  oauth: {
    startLogin: () => Promise.resolve({ success: false, error: 'Web版仅支持手动输入Token' }),
    loginWithToken: () => Promise.resolve({ success: false }),
    getStatus: () => Promise.resolve({}),
  },

  toolCalling: {
    getStatus: () => Promise.resolve(null),
    runSmoke: (_input: any) => Promise.resolve({ success: false }),
  },
}

// 暴露给 window，兼容现有代码
;(window as any).electronAPI = api

export default api
