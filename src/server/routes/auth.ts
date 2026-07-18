/**
 * 认证路由
 */
import Router from '@koa/router'
import { storeManager } from '../../main/store/store'
import { generateToken, isSetup } from '../auth'

const router = new Router({ prefix: '/api/auth' })

router.get('/setup', async (ctx) => {
  ctx.body = { success: true, data: { needSetup: !isSetup() } }
})

router.post('/setup', async (ctx) => {
  if (isSetup()) {
    ctx.status = 400
    ctx.body = { success: false, error: { code: 'already_set', message: 'Management password already set' } }
    return
  }
  const { password } = ctx.request.body as { password?: string }
  if (!password || password.length < 6) {
    ctx.status = 400
    ctx.body = { success: false, error: { code: 'invalid', message: 'Password must be at least 6 characters' } }
    return
  }
  const config = storeManager.getConfig()
  storeManager.updateConfig({
    managementApi: { ...config.managementApi, enableManagementApi: true, managementApiSecret: password },
  })
  ctx.body = { success: true, data: { token: generateToken() } }
})

router.post('/login', async (ctx) => {
  const { password } = ctx.request.body as { password?: string }
  const config = storeManager.getConfig()
  if (!config.managementApi?.managementApiSecret) {
    ctx.status = 400
    ctx.body = { success: false, error: { code: 'not_setup', message: 'Please set up management password first' } }
    return
  }
  if (password !== config.managementApi.managementApiSecret) {
    ctx.status = 401
    ctx.body = { success: false, error: { code: 'wrong_password', message: 'Invalid password' } }
    return
  }
  ctx.body = { success: true, data: { token: generateToken() } }
})

export default router
