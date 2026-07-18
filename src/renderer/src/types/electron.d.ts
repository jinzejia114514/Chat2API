/**
 * Web 版 API 客户端类型声明
 * 不再依赖 Electron IPC，所有调用通过 HTTP API
 */
import type {
  Provider, Account, ProxyStatus, ProxyStatistics,
  ProviderCheckResult, OAuthResult, AuthType, CredentialField,
  LogLevel, LoadBalanceStrategy, ModelMapping, AppConfig,
  AccountStatus, ProviderType, ProviderVendor, ProviderStatus,
  ApiKey, SystemPrompt, PromptType, ToolCallingConfig,
  LegacyToolPromptConfig, EffectiveModel,
} from '../../../shared/types'

export type {
  Provider, Account, ProxyStatus, ProxyStatistics,
  ProviderCheckResult, OAuthResult, AuthType, CredentialField,
  LogLevel, LoadBalanceStrategy, ModelMapping, AppConfig,
  AccountStatus, ProviderType, ProviderVendor, ProviderStatus,
  ApiKey, SystemPrompt, PromptType, ToolCallingConfig,
  LegacyToolPromptConfig, EffectiveModel,
}

// Web 版：electronAPI 被替换为 HTTP API 客户端
declare global {
  interface Window {
    electronAPI: any
  }
}

export {}
