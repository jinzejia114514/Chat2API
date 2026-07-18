/**
 * 加密工具 - 替代 Electron safeStorage
 * AES-256-GCM 对称加密
 */
import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'
const SALT = 'chat2api-crypto-salt-v1'

function deriveKey(key?: string): Buffer {
  return scryptSync(key || 'chat2api-fixed-encryption-key-v1', SALT, 32)
}

export function encryptString(plaintext: string, key?: string): string {
  try {
    const k = deriveKey(key)
    const iv = randomBytes(16)
    const c = createCipheriv(ALGO, k, iv)
    const enc = Buffer.concat([c.update(plaintext, 'utf-8'), c.final()])
    return JSON.stringify({ iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: enc.toString('base64') })
  } catch (e) {
    console.error('[Crypto] encrypt failed:', e)
    return plaintext
  }
}

export function decryptString(ciphertext: string, key?: string): string {
  try {
    const parsed = JSON.parse(ciphertext)
    if (!parsed.iv || !parsed.tag || !parsed.data) return ciphertext
    const k = deriveKey(key)
    const d = createDecipheriv(ALGO, k, Buffer.from(parsed.iv, 'base64'))
    d.setAuthTag(Buffer.from(parsed.tag, 'base64'))
    return Buffer.concat([d.update(Buffer.from(parsed.data, 'base64')), d.final()]).toString('utf-8')
  } catch {
    return ciphertext
  }
}
