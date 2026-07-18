/**
 * OAuth Manager - Web 版（移除 Electron BrowserWindow 依赖）
 * 仅保留 OAuth 适配器逻辑，In-App 登录改为手动模式
 */
import { shell } from 'fs'  // placeholder - won't actually use shell
import { ProviderType, OAuthResult, ProviderVendor } from '../types'
import { createAdapter, getSupportedAuthMethods } from './adapters'
import { AdapterConfig, OAuthAdapter } from './adapters/base'

export class OAuthManager {
  private adapters: Map<string, OAuthAdapter> = new Map()

  getSupportedAuthMethods(providerType: ProviderType): string[] {
    return getSupportedAuthMethods(providerType)
  }

  async startLogin(providerId: string, providerType: ProviderType): Promise<OAuthResult> {
    const adapter = this.getAdapter(providerId, providerType)
    return adapter.startLogin({ providerId, providerType })
  }

  async loginWithToken(
    providerId: string,
    providerType: ProviderType,
    credentials: Record<string, string>
  ): Promise<OAuthResult> {
    const adapter = this.getAdapter(providerId, providerType)
    const validation = await adapter.validateToken(credentials)

    if (!validation.valid) {
      return {
        success: false,
        providerId,
        error: validation.error || 'Token validation failed',
      }
    }

    return {
      success: true,
      providerId,
      providerType: providerType as unknown as ProviderVendor,
      credentials,
      accountInfo: validation.accountInfo,
    }
  }

  async refreshToken(
    providerId: string,
    providerType: ProviderType,
    credentials: Record<string, string>
  ): Promise<OAuthResult | null> {
    const adapter = this.getAdapter(providerId, providerType)
    return adapter.refreshToken(credentials)
  }

  private getAdapter(providerId: string, providerType: ProviderType): OAuthAdapter {
    const key = `${providerType}:${providerId}`
    if (!this.adapters.has(key)) {
      const config: AdapterConfig = { providerId, providerType }
      this.adapters.set(key, createAdapter(providerType, config))
    }
    return this.adapters.get(key)!
  }
}

export const oauthManager = new OAuthManager()
