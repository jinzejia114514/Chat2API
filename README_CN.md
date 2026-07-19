# Chat2API Web Edition

<p align="center">
  <img src="build/icons.png" alt="Chat2API Logo" width="128" height="128">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Release-v2.0.0--web-blue?style=flat-square&logo=github" alt="Release">
  <img src="https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square" alt="License">
  <br>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"></a>
  <img src="https://img.shields.io/badge/Platform-Lightgrey?style=flat-square" alt="Platform">
</p>

<p align="center">
  <strong><a href="README.md">English</a></strong>
</p>

<p align="center">
  <strong>AI 服务统一管理工具 — Web 版</strong>
</p>

<p align="center">
  Chat2API Web 版是原 Electron 桌面应用的浏览器重写版本。
  通过 Web UI 管理多个 AI 服务商，通过 OpenAI 兼容 API 代理请求。
</p>

> ⚠️ **状态**：活跃开发中 — 可能存在 Bug。详见 [Issues](https://github.com/jinzejia114514/Chat2API/issues)。

## ✨ 功能特性

- **OpenAI 兼容 API** — 标准 `/v1/chat/completions` 接口，兼容所有 OpenAI 客户端
- **多服务商支持** — DeepSeek、GLM、Kimi、MiniMax、Perplexity、Qwen、Z.ai 等
- **Web UI** — 通过浏览器管理服务商、账号、模型，监控流量
- **上下文管理** — 多轮对话，支持滑动窗口和 Token 限制
- **工具调用** — 通过提示词工程为所有模型提供通用工具调用能力
- **仪表盘监控** — 实时请求流量、Token 使用量和成功率
- **API Key 管理** — 为本地代理生成和管理密钥
- **请求日志** — 详细的请求日志记录，便于调试和分析
- **JWT 认证** — 安全的基于 Token 的登录认证
- **深色/浅色主题** — 响应式界面，支持主题切换

## 🤖 支持的服务商

| 服务商     | 认证类型       | 模型                            |
| --------- | ------------ | ------------------------------- |
| DeepSeek  | User Token   | deepseek-v4-flash, deepseek-v4-pro |
| GLM       | Refresh Token | GLM-5.1                        |
| Kimi      | JWT Token    | Kimi-K2.6                       |
| MiniMax   | JWT Token    | MiniMax-M2.7                    |
| Mimo      | Cookie       | MiMo-V2.5-Pro, MiMo-V2.5        |
| Perplexity | Cookie       | Auto                            |
| Qwen      | SSO Ticket   | Qwen3 系列                      |
| Z.ai      | Token        | GLM-5 系列                      |

---

## 🚀 快速开始

### 环境要求

- Node.js 20+
- 512MB+ 内存（构建需要）

### 一键启动

```bash
# 克隆
git clone https://github.com/jinzejia114514/Chat2API.git
cd Chat2API

# 安装依赖（国内用淘宝镜像）
npm install --registry=https://registry.npmmirror.com

# 一键启动
./start.sh
```

然后打开 `http://localhost:8080` 即可使用。

### 启动脚本

项目根目录包含两个便捷脚本：

```bash
./start.sh          # 构建（如需）并启动服务
./stop.sh           # 停止服务
```

环境变量：

```bash
PORT=9090 ./start.sh                    # 自定义端口
HOST=127.0.0.1 ./start.sh               # 仅本机访问
MAX_MEM=1024 ./start.sh                 # 增加内存限制（MB）
```

### 手动启动

```bash
# 构建前端
NODE_OPTIONS="--max-old-space-size=512" npx vite build

# 启动服务器（前台）
NODE_OPTIONS="--max-old-space-size=512" npx tsx src/server/index.ts

# 启动服务器（后台）
NODE_OPTIONS="--max-old-space-size=512" nohup npx tsx src/server/index.ts > /tmp/chat2api.log 2>&1 &
```

---

## 📖 使用方法

### 步骤 1：登录

首次访问会跳转到设置页面，创建管理员账号。

### 步骤 2：添加服务商

1. 从侧边栏进入**服务商**页面
2. 点击**添加服务商**
3. 选择内置服务商（如 DeepSeek）
4. 输入认证凭证
5. 点击**验证**测试 Token 是否有效

### 步骤 3：配置代理

1. 进入**代理设置**
2. 设置端口（默认：8080）
3. 选择负载均衡策略：轮询 / 填充优先 / 故障转移
4. 点击**启动代理**

### 步骤 4：测试 API

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://localhost:8080/v1"
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[{"role": "user", "content": "你好！"}]
)
print(response.choices[0].message.content)
```

---

## 🏗️ 架构

```
浏览器 → HTTP → Koa 服务器 (端口 8080)
                   ├── /v1/chat/completions  (代理 → AI 服务商)
                   ├── /v1/models
                   ├── /api/auth/*          (登录/登出/初始化)
                   ├── /api/providers/*     (增删改查)
                   ├── /api/accounts/*      (增删改查 + 验证)
                   ├── /api/proxy/*         (启动/停止/状态)
                   ├── /api/config/*        (配置)
                   ├── /api/logs/*          (请求日志)
                   ├── /api/sessions/*      (对话会话)
                   ├── /api/prompts/*       (系统提示词)
                   └── /*                   (React SPA)
```

### 项目结构

```
src/
├── server/              # Koa HTTP 服务器
│   ├── index.ts         # 入口：中间件 + 路由
│   ├── jsonStore.ts     # JSON 文件存储
│   ├── crypto.ts        # AES-256-GCM 加密
│   ├── auth.ts          # JWT 中间件
│   └── routes/
│       ├── auth.ts      # 认证端点
│       └── api.ts       # 业务 API 端点
├── main/                # 业务逻辑
│   ├── oauth/           # OAuth 适配器
│   ├── providers/       # 服务商配置
│   ├── proxy/           # 代理服务器 + 适配器
│   └── store/           # 存储管理器
├── renderer/            # React 前端
│   └── src/
│       ├── api/client.ts    # HTTP 客户端 (window.electronAPI)
│       ├── components/      # UI 组件
│       ├── pages/           # 页面组件
│       └── stores/          # Zustand 状态
└── shared/              # 共享类型
```

---

## 🔧 技术栈

| 组件     | 技术                    |
| -------- | --------------------- |
| 后端     | Node.js + Koa         |
| 前端     | React 18 + TypeScript |
| 样式     | Tailwind CSS          |
| 状态管理  | Zustand               |
| 构建工具  | Vite                  |
| 认证     | JWT                   |
| 存储     | JSON 文件（加密）       |

---

## 📁 数据存储

应用数据存储在 `~/.chat2api/`：

- `data.json` — 所有应用数据（AES-256-GCM 加密）

---

## ⚙️ 配置

| 变量     | 默认值    | 说明         |
| -------- | -------- | ------------ |
| `PORT`   | `8080`   | 服务器端口    |
| `HOST`   | `0.0.0.0` | 绑定地址     |

---

## 🤝 贡献

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing-feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目基于 [Chat2API](https://github.com/xiaoY233/Chat2API) 开发，使用 **GNU 通用公共许可证 v3.0**。详见 [LICENSE](LICENSE)。

- ✅ 可以自由使用、修改和分发
- ✅ 衍生作品必须以相同许可证开源
- ✅ 必须保留原始版权声明

### 原始版权

```
Copyright (C) 2024 xiaoY233
原始项目: https://github.com/xiaoY233/Chat2API
```

### Web 版

```
Chat2API Web Edition — 原 Electron 应用的浏览器重写版本
Copyright (C) 2026 jinzejia114514
仓库: https://github.com/jinzejia114514/Chat2API
```

---

## 🙏 致谢

- [原版 Chat2API](https://github.com/xiaoY233/Chat2API) — 提供基础
- [Koa](https://koajs.com/) — HTTP 服务器
- [React](https://react.dev/) — UI 框架
- [Tailwind CSS](https://tailwindcss.com/) — CSS 框架
- [Zustand](https://zustand-demo.pmnd.rs/) — 状态管理
