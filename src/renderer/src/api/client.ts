const TOKEN_KEY = 'chat2api_token'
function getToken(): string | null { return localStorage.getItem(TOKEN_KEY) }
function setToken(token: string) { localStorage.setItem(TOKEN_KEY, token) }
function clearToken() { localStorage.removeItem(TOKEN_KEY) }

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const resp = await fetch(path, { ...options, headers })
  if (resp.status === 401) {
    clearToken()
    if (!window.location.pathname.includes('/login')) { window.location.hash = '#/login' }
    throw new Error('Unauthorized')
  }
  return resp.json()
}

export const api = {
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
  proxy: {
    getStatus: () => apiFetch('/api/proxy/status').then((r: any) => r.data),
    start: (port?: number) => apiFetch('/api/proxy/start', { method: 'POST', body: JSON.stringify({ port }) }),
    stop: () => apiFetch('/api/proxy/stop', { method: 'POST' }),
    getStatistics: () => apiFetch('/api/proxy/statistics').then((r: any) => r.data),
    onStatusChanged: () => () => {},
  },
  config: {
    get: () => apiFetch('/api/config').then((r: any) => r.data),
    update: (updates: any) => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify(updates) }).then((r: any) => r.data),
    onConfigChanged: () => () => {},
  },
  providers: {
    getAll: () => apiFetch('/api/providers').then((r: any) => r.data),
    getBuiltin: () => apiFetch('/api/providers/builtin').then((r: any) => r.data),
    getById: (id: string) => apiFetch(`/api/providers/${id}`).then((r: any) => r.data),
    add: (data: any) => apiFetch('/api/providers', { method: 'POST', body: JSON.stringify(data) }).then((r: any) => r.data),
    update: (id: string, data: any) => apiFetch(`/api/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r: any) => r.data),
    delete: (id: string) => apiFetch(`/api/providers/${id}`, { method: 'DELETE' }),
    checkAllStatus: () => Promise.resolve({}),
    checkStatus: (id: string) => Promise.resolve({ providerId: id, status: 'unknown' }),
    duplicate: (id: string) => apiFetch(`/api/providers/${id}`).then((r: any) => r.data),
    export: (id: string) => apiFetch(`/api/providers/${id}`).then((r: any) => r.data),
    import: (data: string) => apiFetch('/api/providers', { method: 'POST', body: data }).then((r: any) => r.data),
    updateModels: (id: string) => Promise.resolve({ success: true, modelsCount: 0 }),
    getEffectiveModels: (id: string) => apiFetch(`/api/providers/${id}/models`).then((r: any) => r.data),
    addCustomModel: (id: string, model: any) => apiFetch(`/api/providers/${id}/models`, { method: 'POST', body: JSON.stringify(model) }).then((r: any) => r.data),
    removeModel: (id: string, name: string) => apiFetch(`/api/providers/${id}/models/${encodeURIComponent(name)}`, { method: 'DELETE' }).then((r: any) => r.data),
    resetModels: (id: string) => apiFetch(`/api/providers/${id}/models/reset`, { method: 'POST' }).then((r: any) => r.data),
    syncModels: (id: string) => Promise.resolve({ success: true }),
    getSupportedModels: (id: string) => Promise.resolve([]),
  },
  accounts: {
    getAll: (includeCredentials?: boolean) => apiFetch(`/api/accounts${includeCredentials ? '?credentials=true' : ''}`).then((r: any) => r.data),
    getById: (id: string, includeCredentials?: boolean) => apiFetch(`/api/accounts/${id}${includeCredentials ? '?credentials=true' : ''}`).then((r: any) => r.data),
    getByProvider: (providerId: string) => apiFetch(`/api/accounts?providerId=${providerId}`).then((r: any) => r.data),
    add: (data: any) => apiFetch('/api/accounts', { method: 'POST', body: JSON.stringify(data) }).then((r: any) => r.data),
    update: (id: string, data: any) => apiFetch(`/api/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r: any) => r.data),
    delete: (id: string) => apiFetch(`/api/accounts/${id}`, { method: 'DELETE' }),
    validate: (id: string) => apiFetch(`/api/accounts/${id}/validate`, { method: 'POST' }).then((r: any) => r.data),
    validateToken: (providerId: string, credentials: Record<string, string>) => apiFetch('/api/accounts/validate-token', { method: 'POST', body: JSON.stringify({ providerId, credentials }) }).then((r: any) => r.data),
    getCredits: (id: string) => apiFetch(`/api/accounts/${id}/credits`).then((r: any) => r.data),
    clearChats: (id: string) => apiFetch(`/api/accounts/${id}/clear-chats`, { method: 'POST' }),
    refreshToken: (id: string) => apiFetch(`/api/accounts/${id}/refresh`, { method: 'POST' }).then((r: any) => r.data),
  },
  logs: {
    get: (filter?: any) => apiFetch('/api/logs').then((r: any) => r.data),
    clear: () => apiFetch('/api/logs', { method: 'DELETE' }),
    getStats: () => apiFetch('/api/logs/stats').then((r: any) => r.data),
    getTrend: (days?: number) => apiFetch('/api/logs').then((r: any) => r.data),
    getAccountTrend: (accountId: string, days?: number) => apiFetch(`/api/logs?accountId=${accountId}&days=${days || 7}`).then((r: any) => r.data),
    export: () => apiFetch('/api/logs').then((r: any) => r.data),
    getById: (id: string) => Promise.resolve(undefined),
  },
  requestLogs: {
    get: (filter?: any) => apiFetch('/api/request-logs').then((r: any) => r.data),
    clear: () => apiFetch('/api/request-logs', { method: 'DELETE' }),
    getStats: () => apiFetch('/api/logs/stats').then((r: any) => r.data),
    getTrend: (days?: number) => apiFetch('/api/request-logs').then((r: any) => r.data),
  },
  statistics: {
    get: () => apiFetch('/api/statistics').then((r: any) => r.data),
    getToday: () => apiFetch('/api/statistics/today').then((r: any) => r.data),
  },
  session: {
    getAll: () => apiFetch('/api/sessions').then((r: any) => r.data),
    getActive: () => Promise.resolve([]),
    getById: (id: string) => Promise.resolve(undefined),
    getByAccount: (accountId: string) => Promise.resolve([]),
    getByProvider: (providerId: string) => Promise.resolve([]),
    delete: (id: string) => apiFetch(`/api/sessions/${id}`, { method: 'DELETE' }),
    clearAll: () => apiFetch('/api/sessions', { method: 'DELETE' }),
    getConfig: () => apiFetch('/api/config').then((r: any) => r.data?.sessionConfig),
    updateConfig: (cfg: any) => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify({ sessionConfig: cfg }) }),
    cleanExpired: () => Promise.resolve(0),
  },
  prompts: {
    getAll: () => apiFetch('/api/prompts').then((r: any) => r.data),
    getBuiltin: () => apiFetch('/api/prompts').then((r: any) => r.data),
    add: (data: any) => apiFetch('/api/prompts', { method: 'POST', body: JSON.stringify(data) }).then((r: any) => r.data),
    update: (id: string, data: any) => apiFetch(`/api/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r: any) => r.data),
    delete: (id: string) => apiFetch(`/api/prompts/${id}`, { method: 'DELETE' }),
  },
  app: {
    getVersion: () => apiFetch('/api/version').then((r: any) => r.data?.version),
    checkUpdate: () => Promise.resolve({ updateAvailable: false }),
    getUpdateStatus: () => Promise.resolve({}),
    openExternal: (url: string) => { window.open(url, '_blank'); return Promise.resolve() },
    downloadUpdate: () => Promise.resolve(),
    installUpdate: () => Promise.resolve(),
    onUpdateChecking: () => () => {},
    onUpdateAvailable: () => () => {},
    onUpdateNotAvailable: () => () => {},
    onUpdateProgress: () => () => {},
    onUpdateDownloaded: () => () => {},
    onUpdateError: () => () => {},
  },
  store: {
    get: (key: string) => apiFetch(`/api/config`).then((r: any) => r.data?.[key]),
    set: (key: string, value: any) => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify({ [key]: value }) }),
    clearAll: () => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify({}) }),
    delete: (key: string) => Promise.resolve(),
    onInitError: () => () => {},
    retryInit: () => Promise.resolve({ success: true }),
  },
  invoke: (_channel: string, ..._args: any[]) => Promise.resolve(null),
  send: (_channel: string, ..._args: any[]) => {},
  on: (_channel: string, _cb: any) => () => {},
  tray: { openDashboard: () => {}, setHeight: () => {}, quitApp: () => {} },
  managementApi: {
    getConfig: () => apiFetch('/api/config').then((r: any) => r.data?.managementApi),
    updateConfig: (cfg: any) => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify({ managementApi: cfg }) }),
    generateSecret: () => Promise.resolve(''),
  },
  contextManagement: {
    getConfig: () => apiFetch('/api/config').then((r: any) => r.data?.contextManagement),
    updateConfig: (cfg: any) => apiFetch('/api/config', { method: 'PUT', body: JSON.stringify({ contextManagement: cfg }) }),
  },
  oauth: {
    startLogin: () => Promise.resolve({ success: false, error: 'Web版仅支持手动输入Token' }),
    loginWithToken: (providerId: string, credentials: Record<string, string>) => apiFetch('/api/accounts/validate-token', { method: 'POST', body: JSON.stringify({ providerId, credentials }) }),
    getStatus: () => Promise.resolve({}),
  },
  toolCalling: {
    getStatus: () => Promise.resolve(null),
    runSmoke: () => Promise.resolve({ success: false }),
  },
}

;(window as any).electronAPI = api
export default api
