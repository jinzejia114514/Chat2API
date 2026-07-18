/**
 * JSON File Store - electron-store 的纯 Node.js 替代品
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs'
import { join, dirname } from 'path'
import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'
const SALT = 'chat2api-store-salt-v1'

export class JsonFileStore<T extends Record<string, unknown>> {
  private readonly filePath: string
  private readonly defaults: T
  private readonly encKey?: string
  private data: T
  private timer: NodeJS.Timeout | null = null

  constructor(opts: { name: string; cwd: string; defaults: T; encryptionKey?: string }) {
    this.filePath = join(opts.cwd, `${opts.name}.json`)
    this.defaults = opts.defaults
    this.encKey = opts.encryptionKey
    this.data = this.load()
  }

  private load(): T {
    const dir = dirname(this.filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    if (!existsSync(this.filePath)) return { ...this.defaults }
    try {
      const raw = readFileSync(this.filePath, 'utf-8')
      const json = this.encKey ? this.decrypt(raw) : raw
      return { ...this.defaults, ...JSON.parse(json) }
    } catch (e) {
      console.error('[Store] Load failed, using defaults:', e)
      try { renameSync(this.filePath, `${this.filePath}.bak.${Date.now()}`) } catch {}
      return { ...this.defaults }
    }
  }

  private save(): void {
    const json = JSON.stringify(this.data, null, 2)
    const content = this.encKey ? this.encrypt(json) : json
    writeFileSync(this.filePath, content, 'utf-8')
  }

  private deriveKey(): Buffer {
    return scryptSync(this.encKey || 'default', SALT, 32)
  }

  private encrypt(pt: string): string {
    const key = this.deriveKey()
    const iv = randomBytes(16)
    const c = createCipheriv(ALGO, key, iv)
    const enc = Buffer.concat([c.update(pt, 'utf-8'), c.final()])
    return JSON.stringify({ iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: enc.toString('base64') })
  }

  private decrypt(ct: string): string {
    const { iv, tag, data } = JSON.parse(ct)
    const key = this.deriveKey()
    const d = createDecipheriv(ALGO, key, Buffer.from(iv, 'base64'))
    d.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf-8')
  }

  get<K extends keyof T>(key: K): T[K] { return this.data[key] }
  set<K extends keyof T>(key: K, val: T[K]): void {
    this.data = { ...this.data, [key]: val }
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => { this.save(); this.timer = null }, 100)
  }
  flushSync(): void { if (this.timer) { clearTimeout(this.timer); this.timer = null } this.save() }
  clear(): void { this.data = { ...this.defaults }; this.save() }
  getStore(): T { return this.data }
}
