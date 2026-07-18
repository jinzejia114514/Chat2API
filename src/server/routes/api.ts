import Router from '@koa/router'
import { storeManager } from '../../main/store/store'
import { ProviderManager } from '../../main/store/providers'
import { AccountManager } from '../../main/store/accounts'
import { ConfigManager } from '../../main/store/config'
import { proxyServer } from '../../main/proxy/server'
import { proxyStatusManager } from '../../main/proxy/status'
import { sessionManager } from '../../main/proxy/sessionManager'

const router = new Router({ prefix: '/api' })

// ==================== Proxy ====================
router.get('/proxy/status', async (ctx) => {
  ctx.body = { success: true, data: proxyStatusManager.getRunningStatus() }
})
router.post('/proxy/start', async (ctx) => {
  const { port, host } = ctx.request.body as any
  const config = storeManager.getConfig()
  ctx.body = { success: await proxyServer.start(port || config.proxyPort, host || config.proxyHost) }
})
router.post('/proxy/stop', async (ctx) => {
  ctx.body = { success: await proxyServer.stop() }
})
router.get('/proxy/statistics', async (ctx) => {
  ctx.body = { success: true, data: proxyStatusManager.getStatistics() }
})

// ==================== Providers ====================
router.get('/providers', async (ctx) => {
  ctx.body = { success: true, data: ProviderManager.getAll() }
})
router.get('/providers/builtin', async (ctx) => {
  const { getBuiltinProviders } = await import('../../main/providers/builtin')
  ctx.body = { success: true, data: getBuiltinProviders() }
})
router.get('/providers/:id', async (ctx) => {
  const provider = ProviderManager.getById(ctx.params.id)
  if (!provider) { ctx.status = 404; ctx.body = { success: false, error: { message: 'Not found' } }; return }
  ctx.body = { success: true, data: provider }
})
router.post('/providers', async (ctx) => {
  const body = ctx.request.body as any
  const provider = ProviderManager.create(body)
  ctx.status = 201
  ctx.body = { success: true, data: provider }
})
router.put('/providers/:id', async (ctx) => {
  const provider = ProviderManager.update(ctx.params.id, ctx.request.body as any)
  if (!provider) { ctx.status = 404; ctx.body = { success: false, error: { message: 'Not found' } }; return }
  ctx.body = { success: true, data: provider }
})
router.delete('/providers/:id', async (ctx) => {
  ctx.body = { success: ProviderManager.delete(ctx.params.id) }
})

// ==================== Accounts ====================
router.get('/accounts', async (ctx) => {
  const includeCreds = ctx.query.credentials === 'true'
  ctx.body = { success: true, data: AccountManager.getAll(includeCreds) }
})
router.post('/accounts', async (ctx) => {
  const account = AccountManager.create(ctx.request.body as any)
  ctx.status = 201
  ctx.body = { success: true, data: account }
})

// Account sub-routes (MUST be before /:id routes)
router.post('/accounts/validate-token', async (ctx) => {
  const { providerId, credentials } = ctx.request.body as any
  if (!providerId || !credentials) {
    ctx.status = 400
    ctx.body = { success: false, error: { message: 'Missing providerId or credentials' } }
    return
  }
  try {
    const { validateCredentials } = await import('../../main/store/validator')
    const provider = ProviderManager.getById(providerId)
    if (!provider) {
      ctx.status = 404
      ctx.body = { success: false, error: { message: 'Provider not found' } }
      return
    }
    const result = await validateCredentials(provider, credentials)
    ctx.body = { success: true, data: result }
  } catch (error: any) {
    ctx.body = { success: true, data: { valid: false, error: error.message || 'Validation failed' } }
  }
})
router.post('/accounts/:id/validate', async (ctx) => {
  const account = AccountManager.getById(ctx.params.id, true)
  if (!account) { ctx.status = 404; ctx.body = { success: false, error: { message: 'Account not found' } }; return }
  try {
    const { validateCredentials } = await import('../../main/store/validator')
    const provider = ProviderManager.getById(account.providerId)
    if (!provider) { ctx.body = { success: false, error: { message: 'Provider not found' } }; return }
    const result = await validateCredentials(provider, account.credentials)
    ctx.body = { success: true, data: result }
  } catch (error: any) {
    ctx.body = { success: true, data: { valid: false, error: error.message } }
  }
})
router.get('/accounts/:id/credits', async (ctx) => {
  const account = AccountManager.getById(ctx.params.id)
  if (!account) { ctx.status = 404; ctx.body = { success: false }; return }
  ctx.body = { success: true, data: { balance: 0, used: 0 } }
})
router.post('/accounts/:id/clear-chats', async (ctx) => {
  const account = AccountManager.getById(ctx.params.id)
  if (!account) { ctx.status = 404; ctx.body = { success: false }; return }
  ctx.body = { success: true }
})
router.post('/accounts/:id/refresh', async (ctx) => {
  const account = AccountManager.getById(ctx.params.id)
  if (!account) { ctx.status = 404; ctx.body = { success: false }; return }
  ctx.body = { success: true, data: account }
})

router.get('/accounts/:id', async (ctx) => {
  const includeCreds = ctx.query.credentials === 'true'
  const account = AccountManager.getById(ctx.params.id, includeCreds)
  if (!account) { ctx.status = 404; ctx.body = { success: false, error: { message: 'Not found' } }; return }
  ctx.body = { success: true, data: account }
})
router.put('/accounts/:id', async (ctx) => {
  const account = AccountManager.update(ctx.params.id, ctx.request.body as any)
  if (!account) { ctx.status = 404; ctx.body = { success: false, error: { message: 'Not found' } }; return }
  ctx.body = { success: true, data: account }
})
router.delete('/accounts/:id', async (ctx) => {
  ctx.body = { success: AccountManager.delete(ctx.params.id) }
})

// ==================== Config ====================
router.get('/config', async (ctx) => {
  ctx.body = { success: true, data: ConfigManager.get() }
})
router.put('/config', async (ctx) => {
  ctx.body = { success: true, data: ConfigManager.update(ctx.request.body as any) }
})

// ==================== Logs ====================
router.get('/logs', async (ctx) => {
  ctx.body = { success: true, data: storeManager.getLogs() }
})
router.delete('/logs', async (ctx) => {
  storeManager.clearLogs()
  ctx.body = { success: true }
})
router.get('/request-logs', async (ctx) => {
  ctx.body = { success: true, data: storeManager.getRequestLogs() }
})
router.delete('/request-logs', async (ctx) => {
  storeManager.clearRequestLogs()
  ctx.body = { success: true }
})
router.get('/logs/stats', async (ctx) => {
  ctx.body = { success: true, data: storeManager.getLogStats() }
})

// ==================== Statistics ====================
router.get('/statistics', async (ctx) => {
  ctx.body = { success: true, data: storeManager.getStatistics() }
})
router.get('/statistics/today', async (ctx) => {
  ctx.body = { success: true, data: storeManager.getTodayStatistics() }
})

// ==================== Sessions ====================
router.get('/sessions', async (ctx) => {
  ctx.body = { success: true, data: sessionManager.getAllSessions() }
})
router.delete('/sessions/:id', async (ctx) => {
  ctx.body = { success: sessionManager.deleteSession(ctx.params.id) }
})
router.delete('/sessions', async (ctx) => {
  sessionManager.clearAllSessions()
  ctx.body = { success: true }
})

// ==================== Prompts ====================
router.get('/prompts', async (ctx) => {
  ctx.body = { success: true, data: storeManager.getSystemPrompts() }
})
router.post('/prompts', async (ctx) => {
  const prompt = storeManager.addSystemPrompt(ctx.request.body as any)
  ctx.status = 201
  ctx.body = { success: true, data: prompt }
})
router.put('/prompts/:id', async (ctx) => {
  const prompt = storeManager.updateSystemPrompt(ctx.params.id, ctx.request.body as any)
  ctx.body = { success: !!prompt, data: prompt }
})
router.delete('/prompts/:id', async (ctx) => {
  ctx.body = { success: storeManager.deleteSystemPrompt(ctx.params.id) }
})

// ==================== Version ====================
router.get('/version', async (ctx) => {
  ctx.body = { success: true, data: { version: '2.0.0' } }
})


// ==================== Model Management ====================
router.get('/providers/:id/models', async (ctx) => {
  const models = storeManager.getEffectiveModels(ctx.params.id)
  ctx.body = { success: true, data: models }
})

router.post('/providers/:id/models', async (ctx) => {
  const { displayName, actualModelId } = ctx.request.body as any
  if (!displayName || !actualModelId) {
    ctx.status = 400
    ctx.body = { success: false, error: { message: 'Missing displayName or actualModelId' } }
    return
  }
  try {
    const models = storeManager.addCustomModel(ctx.params.id, { displayName, actualModelId })
    ctx.body = { success: true, data: models }
  } catch (error: any) {
    ctx.status = 400
    ctx.body = { success: false, error: { message: error.message } }
  }
})

router.delete('/providers/:id/models/:name', async (ctx) => {
  try {
    const models = storeManager.removeModel(ctx.params.id, ctx.params.name)
    ctx.body = { success: true, data: models }
  } catch (error: any) {
    ctx.status = 400
    ctx.body = { success: false, error: { message: error.message } }
  }
})

router.post('/providers/:id/models/reset', async (ctx) => {
  try {
    const models = storeManager.resetModels(ctx.params.id)
    ctx.body = { success: true, data: models }
  } catch (error: any) {
    ctx.status = 400
    ctx.body = { success: false, error: { message: error.message } }
  }
})

export default router
