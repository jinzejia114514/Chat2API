/**
 * Chat2API Web Server - 纯 Node.js 服务器入口
 * 替代 Electron 桌面壳层
 */
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import serve from 'koa-static'
import { join } from 'path'
import { existsSync } from 'fs'

import { storeManager } from '../main/store/store'
import { proxyServer } from '../main/proxy/server'
import { proxyStatusManager } from '../main/proxy/status'

import { authMiddleware } from './auth'
import authRoutes from './routes/auth'
import apiRoutes from './routes/api'

const PORT = parseInt(process.env.PORT || '8080')
const HOST = process.env.HOST || '0.0.0.0'

async function main() {
  // 1. 初始化存储
  await storeManager.initialize()
  console.log('[Server] Storage initialized')

  // 2. 创建 Koa 应用
  const app = new Koa()

  // 3. 全局中间件
  app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (ctx.method === 'OPTIONS') { ctx.status = 204; return }
    await next()
  })

  app.use(bodyParser({ jsonLimit: '50mb', formLimit: '50mb', textLimit: '50mb' }))

  // 4. API Key 校验（代理路径）
  app.use(async (ctx, next) => {
    const publicPaths = ['/', '/health', '/stats', '/api/auth/login', '/api/auth/setup']
    if (publicPaths.includes(ctx.path)) return next()
    if (ctx.path.startsWith('/api/')) return next() // API 路由有自己的认证
    if (!ctx.path.startsWith('/v1/')) return next()

    const config = storeManager.getConfig()
    if (config.enableApiKey && config.apiKeys?.length > 0) {
      const authHeader = ctx.get('Authorization') || ''
      const key = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (ctx.query.api_key as string) || ctx.get('X-API-Key')
      if (!key || !config.apiKeys.find((k: any) => k.key === key && k.enabled)) {
        ctx.status = 401
        ctx.body = { error: { message: 'Invalid or missing API key', type: 'auth_error' } }
        return
      }
    }
    await next()
  })

  // 5. 注册路由
  app.use(authRoutes.routes()).use(authRoutes.allowedMethods())
  app.use(apiRoutes.routes()).use(apiRoutes.allowedMethods())

  // 6. 注册代理路由（复用现有 proxy routes）
  const proxyRoutes = await import('../main/proxy/routes')
  for (const route of proxyRoutes.default) {
    app.use(route.routes()).use(route.allowedMethods())
  }

  // 7. 健康检查
  app.use(async (ctx, next) => {
    if (ctx.path === '/health') {
      const status = proxyStatusManager.getRunningStatus()
      ctx.body = { status: status.isRunning ? 'running' : 'stopped', uptime: status.uptime }
      return
    }
    await next()
  })

  // 8. 静态文件服务（SPA）
  const publicDir = join(__dirname, '../../dist/public')
  if (existsSync(publicDir)) {
    app.use(serve(publicDir))
    // SPA fallback
    app.use(async (ctx) => {
      if (ctx.method === 'GET' && !ctx.path.startsWith('/api') && !ctx.path.startsWith('/v1')) {
        const { readFileSync } = await import('fs')
        ctx.type = 'html'
        ctx.body = readFileSync(join(publicDir, 'index.html'), 'utf-8')
      }
    })
  }

  // 9. 自动启动代理
  const config = storeManager.getConfig()
  if (config.autoStartProxy) {
    const result = await proxyServer.start(config.proxyPort, config.proxyHost)
    console.log(`[Server] Auto-start proxy: ${result ? 'OK' : 'FAILED'} on ${config.proxyHost}:${config.proxyPort}`)
  }

  // 10. 启动 HTTP 服务器
  app.listen(PORT, HOST, () => {
    console.log(`[Server] Chat2API Web running at http://${HOST}:${PORT}`)
    console.log(`[Server] Proxy: ${proxyServer.isRunning() ? 'running' : 'stopped'}`)
  })
}

main().catch((err) => {
  console.error('[Server] Fatal error:', err)
  process.exit(1)
})
