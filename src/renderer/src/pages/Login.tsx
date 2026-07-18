import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { toast } from '../hooks/use-toast'

const Login: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [needSetup, setNeedSetup] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await window.electronAPI.auth.checkSetup()
        setNeedSetup(res?.data?.needSetup ?? false)
      } catch {
        setNeedSetup(true)
      } finally {
        setChecking(false)
      }
    }
    // 检查是否已登录
    const token = localStorage.getItem('chat2api_token')
    if (token) {
      navigate('/')
      return
    }
    check()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      toast({ variant: 'destructive', title: '密码至少需要6个字符' })
      return
    }
    setLoading(true)
    try {
      const res = needSetup
        ? await window.electronAPI.auth.setup(password)
        : await window.electronAPI.auth.login(password)
      if (res.success) {
        toast({ title: needSetup ? '设置成功' : '登录成功' })
        navigate('/')
      } else {
        toast({ variant: 'destructive', title: res?.error?.message || '操作失败' })
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: err.message || '操作失败' })
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Chat2API</CardTitle>
          <CardDescription>
            {needSetup ? '首次使用，请设置管理密码' : '请输入管理密码登录'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Input
              type="password"
              placeholder={needSetup ? '设置密码（至少6位）' : '管理密码'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '处理中...' : (needSetup ? '设置并进入' : '登录')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default Login
