/**
 * Logger Manager - Web 版（移除 Electron 依赖）
 */
import * as fs from 'fs'
import * as path from 'path'
import { homedir } from 'os'
import type { LogEntry, LogLevel } from '../../shared/types'

interface LogStats { total: number; info: number; warn: number; error: number; debug: number }
interface LogFilter { level?: LogLevel | 'all'; keyword?: string; startTime?: number; endTime?: number; limit?: number; offset?: number }
interface LogTrend { date: string; total: number; info: number; warn: number; error: number }

export class LoggerManager {
  private logFile: string = ''
  private logs: LogEntry[] = []
  private maxEntries: number = 10000

  initialize(maxEntries?: number): void {
    if (maxEntries) this.maxEntries = maxEntries
    const logDir = path.join(homedir(), '.chat2api', 'logs')
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    this.logFile = path.join(logDir, 'app.log')
  }

  addLog(entry: LogEntry): void {
    this.logs.push(entry)
    if (this.logs.length > this.maxEntries) this.logs = this.logs.slice(-this.maxEntries)
  }

  getLogs(filter?: LogFilter): LogEntry[] {
    let filtered = [...this.logs]
    if (filter?.level && filter.level !== 'all') filtered = filtered.filter(l => l.level === filter.level)
    if (filter?.keyword) filtered = filtered.filter(l => l.message.includes(filter.keyword!))
    if (filter?.startTime) filtered = filtered.filter(l => l.timestamp >= filter.startTime!)
    if (filter?.endTime) filtered = filtered.filter(l => l.timestamp <= filter.endTime!)
    if (filter?.offset) filtered = filtered.slice(filter.offset)
    if (filter?.limit) filtered = filtered.slice(0, filter.limit)
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  getStats(): LogStats {
    const stats: LogStats = { total: this.logs.length, info: 0, warn: 0, error: 0, debug: 0 }
    this.logs.forEach(l => { if (l.level in stats) stats[l.level]++ })
    return stats
  }

  getTrend(days: number = 7): LogTrend[] {
    const trends: LogTrend[] = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLogs = this.logs.filter(l => new Date(l.timestamp).toISOString().split('T')[0] === dateStr)
      trends.push({
        date: dateStr, total: dayLogs.length,
        info: dayLogs.filter(l => l.level === 'info').length,
        warn: dayLogs.filter(l => l.level === 'warn').length,
        error: dayLogs.filter(l => l.level === 'error').length,
      })
    }
    return trends
  }

  clearLogs(): void { this.logs = [] }

  flushSync(): void {
    try {
      if (this.logFile) fs.writeFileSync(this.logFile, JSON.stringify(this.logs, null, 2))
    } catch {}
  }

  exportLogs(format: 'json' | 'txt' = 'json'): string {
    if (format === 'json') return JSON.stringify(this.logs, null, 2)
    return this.logs.map(l =>
      `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] ${l.message}`
    ).join('\n')
  }
}

export const loggerManager = new LoggerManager()
