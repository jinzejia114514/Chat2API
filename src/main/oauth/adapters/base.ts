/**
 * OAuth Adapter Base Class - Web 版
 */
import http from 'http'
import crypto from 'crypto'
import {
  ProviderType,
  AuthMethod,
  OAuthResult,
  OAuthOptions,
  OAuthCallbackData,
  TokenValidationResult,
  CredentialInfo,
  AdapterConfig,
  OAuthProgressEvent,
} from './types'

export { type AdapterConfig }

export abstract class BaseOAuthAdapter {
  protected providerId: string
  protected providerType: ProviderType
  protected authMethods: string[]
  protected loginUrl: string
  protected apiUrl: string

  constructor(config: AdapterConfig & { authMethods?: string[]; loginUrl?: string; apiUrl?: string }) {
    this.providerId = config.providerId
    this.providerType = config.providerType
    this.authMethods = config.authMethods || ['manual']
    this.loginUrl = config.loginUrl || ''
    this.apiUrl = config.apiUrl || ''
  }

  getSupportedAuthMethods(): string[] {
    return this.authMethods
  }

  abstract startLogin(options: OAuthOptions): Promise<OAuthResult>
  abstract validateToken(credentials: Record<string, string>): Promise<TokenValidationResult>

  async refreshToken(_credentials: Record<string, string>): Promise<OAuthResult | null> {
    return null
  }

  protected async openLoginUrl(url: string): Promise<void> {
    // Web 版：返回 URL 由前端打开
    console.log('[OAuth] Login URL:', url)
  }

  protected createProgressEvent(stage: string, message: string, data?: Record<string, any>): OAuthProgressEvent {
    return { stage, message, data, timestamp: Date.now() }
  }

  protected async startCallbackServer(port: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url!, `http://localhost:${port}`)
        const code = url.searchParams.get('code')
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end('<html><body><h1>登录成功，请关闭此窗口</h1></body></html>')
        server.close()
        if (code) resolve(code)
        else reject(new Error('No code received'))
      })
      server.listen(port, () => {
        server.once('error', reject)
      })
    })
  }

  protected generateState(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}
