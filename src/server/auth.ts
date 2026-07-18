/**
 * Web 认证中间件 - JWT Session
 */
import type { Context, Next } from 'koa'
import jwt from 'jsonwebtoken'
import { storeManager } from '../main/store/store'

const JWT_SECRET = 'chat2api-web-jwt-secret-v1'
const TOKEN_EXPIRY = '7d'

export interface AuthPayload {
  sub: 'admin'
  iat: number
  exp: number
}

/**
 * 生成 JWT Token
 */
export function generateToken(): string {
  return jwt.sign({ sub: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}

/**
 * 认证中间件
 */
export async function authMiddleware(ctx: Context, next: Next): Promise<void> {
  // 公开路径
  const publicPaths = ['/api/auth/login', '/api/auth/setup', '/health']
  if (publicPaths.includes(ctx.path)) {
    await next()
    return
  }

  // 代理路径使用 API Key 认证，不走 JWT
  if (ctx.path.startsWith('/v1/')) {
    await next()
    return
  }

  const authHeader = ctx.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || !verifyToken(token)) {
    ctx.status = 401
    ctx.body = { success: false, error: { code: 'unauthorized', message: '认证已过期或无效，请重新登录' } }
    return
  }

  await next()
}

/**
 * 检查是否已设置管理密码
 */
export function isSetup(): boolean {
  const config = storeManager.getConfig()
  return !!config.managementApi?.managementApiSecret
}
