import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Github,
  FileText,
  Bug,
  Globe,
} from 'lucide-react'
import logoIcon from '@/assets/icons/icons.png'

export function About() {
  const { t } = useTranslation()
  const [appVersion, setAppVersion] = useState<string>('')

  useEffect(() => {
    if (window.electronAPI?.app?.getVersion) {
      window.electronAPI.app.getVersion().then((v: string) => {
        if (v) setAppVersion(v)
      })
    }
  }, [])

  const displayAppVersion = appVersion || '...'

  const handleOpenExternal = (url: string) => {
    if (window.electronAPI?.app?.openExternal) {
      window.electronAPI.app.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const links = [
    {
      label: t('about.github'),
      icon: Github,
      url: 'https://github.com/xiaoY233/Chat2API',
    },
    {
      label: t('about.documentation'),
      icon: FileText,
      url: 'https://chat2api-doc.vercel.app/',
    },
    {
      label: t('about.reportIssue'),
      icon: Bug,
      url: 'https://github.com/xiaoY233/Chat2API/issues',
    },
  ]

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6 pb-12 px-4 animate-fade-in">
        <div className="flex flex-col items-center justify-center py-10 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent-primary)]/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative mb-6 animate-scale-in">
            <div className="relative w-24 h-24 rounded-[2rem] glass-card p-4 shadow-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] overflow-hidden">
              <img
                src={logoIcon}
                alt="Chat2API Logo"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          <div className="space-y-2 z-10">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {t('settings.appName')}
            </h1>
            <p className="text-[var(--text-muted)] font-medium max-w-sm mx-auto">
              {t('about.tagline')}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 mt-3 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
              <span className="text-xs font-mono text-[var(--text-muted)]">
                v{displayAppVersion}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)] flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              {t('about.links')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleOpenExternal(link.url)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)] hover:border-[var(--glass-border-hover)] transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-[var(--bg-tertiary)]/50 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                      <link.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors font-medium">
                      {link.label}
                    </span>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)]/30 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    <span className="text-[10px] text-[var(--text-primary)]">
                      ↗
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center space-y-3 pt-8 pb-4 border-t border-[var(--glass-border)] opacity-60">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--text-dim)] uppercase">
            {t('about.credits')}
          </p>
          <p className="text-xs text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
            {t('about.builtWith')}
          </p>
          <p className="text-[10px] text-[var(--text-dim)] font-mono">
            © {new Date().getFullYear()} {t('settings.appName')} • GPL-3.0 License
          </p>
        </div>
      </div>
    </div>
  )
}
