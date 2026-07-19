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
  <strong><a href="README_CN.md">中文</a></strong>
</p>

<p align="center">
  <strong>AI Service Unified Management Tool — Web Edition</strong>
</p>

<p align="center">
  Chat2API Web Edition is a browser-based rewrite of the original Electron desktop app.
  Manage multiple AI providers, proxy requests through an OpenAI-compatible API, all from a web UI.
</p>

> ⚠️ **Status**: Active development — expect bugs. See [Issues](https://github.com/jinzejia114514/Chat2API/issues) for known problems.

## ✨ Features

- **OpenAI Compatible API** — Standard `/v1/chat/completions` endpoint for any OpenAI-compatible client
- **Multi-Provider Support** — DeepSeek, GLM, Kimi, MiniMax, Perplexity, Qwen, Z.ai, and more
- **Web UI** — Manage providers, accounts, models, and monitor traffic from any browser
- **Context Management** — Multi-turn conversation with sliding window and token limits
- **Function Calling** — Universal tool calling via prompt engineering for all models
- **Dashboard Monitoring** — Real-time request traffic, token usage, and success rates
- **API Key Management** — Generate and manage keys for your local proxy
- **Request Logging** — Detailed logs for debugging and analysis
- **JWT Authentication** — Secure login with token-based auth
- **Dark/Light Theme** — Responsive UI with theme support

## 🤖 Supported Providers

| Provider    | Auth Type     | Models                          |
| ----------- | ------------- | ------------------------------- |
| DeepSeek    | User Token    | deepseek-v4-flash, deepseek-v4-pro |
| GLM         | Refresh Token | GLM-5.1                         |
| Kimi        | JWT Token     | Kimi-K2.6                       |
| MiniMax     | JWT Token     | MiniMax-M2.7                    |
| Mimo        | Cookie        | MiMo-V2.5-Pro, MiMo-V2.5        |
| Perplexity  | Cookie        | Auto                            |
| Qwen        | SSO Ticket    | Qwen3 series                    |
| Z.ai        | Token         | GLM-5 series                    |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- 512MB+ RAM (for build)

### One-Click Start

```bash
# Clone
git clone https://github.com/jinzejia114514/Chat2API.git
cd Chat2API

# Install dependencies (use mirror in China)
npm install --registry=https://registry.npmmirror.com

# Start with one command
./start.sh
```

Then open `http://localhost:8080` in your browser.

### Scripts

The project includes two convenient scripts in the root directory:

```bash
./start.sh          # Build (if needed) and start server
./stop.sh           # Stop server
```

Environment variables:

```bash
PORT=9090 ./start.sh                    # Custom port
HOST=127.0.0.1 ./start.sh               # Bind to localhost only
MAX_MEM=1024 ./start.sh                 # Increase memory limit (MB)
```

### Manual Start

```bash
# Build frontend
NODE_OPTIONS="--max-old-space-size=512" npx vite build

# Start server (foreground)
NODE_OPTIONS="--max-old-space-size=512" npx tsx src/server/index.ts

# Start server (background)
NODE_OPTIONS="--max-old-space-size=512" nohup npx tsx src/server/index.ts > /tmp/chat2api.log 2>&1 &
```

---

## 📖 Usage

### Step 1: Login

On first visit, you'll be redirected to the setup page to create an admin account.

### Step 2: Add a Provider

1. Go to **Providers** from the sidebar
2. Click **Add Provider**
3. Select a built-in provider (e.g., DeepSeek)
4. Enter your authentication credentials
5. Click **Validate** to verify the token

### Step 3: Configure Proxy

1. Go to **Proxy Settings**
2. Set port (default: 8080)
3. Select load balancing strategy: Round Robin / Fill First / Failover
4. Click **Start Proxy**

### Step 4: Test the API

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="http://localhost:8080/v1"
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

---

## 🏗️ Architecture

```
Browser → HTTP → Koa Server (port 8080)
                   ├── /v1/chat/completions  (proxy → AI Provider)
                   ├── /v1/models
                   ├── /api/auth/*          (login/logout/setup)
                   ├── /api/providers/*     (CRUD)
                   ├── /api/accounts/*      (CRUD + validate)
                   ├── /api/proxy/*         (start/stop/status)
                   ├── /api/config/*        (settings)
                   ├── /api/logs/*          (request logs)
                   ├── /api/sessions/*      (conversation sessions)
                   ├── /api/prompts/*       (system prompts)
                   └── /*                   (React SPA)
```

### Project Structure

```
src/
├── server/              # Koa HTTP server
│   ├── index.ts         # Entry: middleware + routes
│   ├── jsonStore.ts     # JSON file storage
│   ├── crypto.ts        # AES-256-GCM encryption
│   ├── auth.ts          # JWT middleware
│   └── routes/
│       ├── auth.ts      # Auth endpoints
│       └── api.ts       # Business API endpoints
├── main/                # Business logic
│   ├── oauth/           # OAuth adapters
│   ├── providers/       # Provider configs
│   ├── proxy/           # Proxy server + adapters
│   └── store/           # Storage managers
├── renderer/            # React frontend
│   └── src/
│       ├── api/client.ts    # HTTP client (window.electronAPI)
│       ├── components/      # UI components
│       ├── pages/           # Page components
│       └── stores/          # Zustand state
└── shared/              # Shared types
```

---

## 🔧 Tech Stack

| Component  | Technology            |
| ---------- | --------------------- |
| Backend    | Node.js + Koa         |
| Frontend   | React 18 + TypeScript |
| Styling    | Tailwind CSS          |
| State      | Zustand               |
| Build      | Vite                  |
| Auth       | JWT                   |
| Storage    | JSON file (encrypted) |

---

## 📁 Data Storage

Application data is stored in `~/.chat2api/`:

- `data.json` — All app data (AES-256-GCM encrypted)

---

## ⚙️ Configuration

| Variable  | Default   | Description        |
| --------- | --------- | ------------------ |
| `PORT`    | `8080`    | Server port        |
| `HOST`    | `0.0.0.0` | Bind address       |

---

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is based on [Chat2API](https://github.com/xiaoY233/Chat2API) and is licensed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for details.

- ✅ Free to use, modify, and distribute
- ✅ Derivative works must be open-sourced under the same license
- ✅ Must preserve original copyright notices

### Original Copyright

```
Copyright (C) 2024 xiaoY233
Original project: https://github.com/xiaoY233/Chat2API
```

### Web Edition

```
Chat2API Web Edition — browser-based rewrite of the original Electron app.
Copyright (C) 2026 jinzejia114514
Repository: https://github.com/jinzejia114514/Chat2API
```

---

## 🙏 Acknowledgments

- [Original Chat2API](https://github.com/xiaoY233/Chat2API) — for the foundation
- [Koa](https://koajs.com/) — HTTP server
- [React](https://react.dev/) — UI framework
- [Tailwind CSS](https://tailwindcss.com/) — CSS framework
- [Zustand](https://zustand-demo.pmnd.rs/) — State management
