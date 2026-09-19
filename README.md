<p align="center">
  <img src="apps/web/public/logo.svg" alt="OpenSandbox Logo" width="90" height="90" />
</p>

<h1 align="center">OpenSandbox</h1>

<p align="center">
  <strong>Visual Flow REST API Builder & Mock Server Platform</strong>
</p>

<p align="center">
  <a href="https://github.com/adysanjaya/opensandbox/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/Runtime-Bun%201.2+-fbf0df?style=flat-square&logo=bun&logoColor=black" alt="Bun Runtime" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Frontend-Next.js%2014-black?style=flat-square&logo=next.js" alt="Next.js 14" /></a>
  <a href="https://hono.dev/"><img src="https://img.shields.io/badge/Backend-Hono%20v4-E36002?style=flat-square&logo=hono&logoColor=white" alt="Hono" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/Database-PostgreSQL%2016-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Ready" /></a>
  <a href="#contributing"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" /></a>
</p>

<p align="center">
  <a href="https://sandbox.adysanjaya.my.id">🌐 Live Demo</a> •
  <a href="https://sandbox.adysanjaya.my.id/docs">📖 Documentation</a> •
  <a href="#quick-start">🚀 Quick Start</a> •
  <a href="#features">✨ Features</a> •
  <a href="CONTRIBUTING.md">🤝 Contributing</a>
</p>

<p align="center">
  <img src="apps/web/public/hero.png" alt="OpenSandbox Flow Canvas Preview" width="850" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</p>

---

## 💡 About OpenSandbox

**OpenSandbox** is a modern, high-performance visual flow builder that lets you create dynamic, production-grade HTTP REST endpoints without writing backend glue code. Design complex conditional branching, variable extractions, external HTTP integrations, random A/B splits, and custom payload transformations right on an interactive visual canvas.

Every user gets their own dedicated hash namespace (`https://api-sandbox.adysanjaya.my.id/{userHash}/{slug}`) with millisecond execution speed, real-time analytics, and built-in multi-language code snippets.

---

## ✨ Features

- 🎨 **Visual Drag-and-Drop Canvas**: Built with `@xyflow/react`, allowing seamless node connections, live validation, and intuitive flow editing.
- ⚡ **8 Powerful Flow Nodes**:
  - **Trigger Node**: Entrypoint supporting `GET`, `POST`, `PUT`, `DELETE`, and `PATCH`.
  - **Condition Node**: Branching logic (`equals`, `contains`, `startsWith`, `endsWith`, `regex`).
  - **HTTP Request Node**: Make external upstream API calls with full variable substitution.
  - **Set Variable Node**: Define custom variables and computed values.
  - **Transform Node**: Extract JSON paths, parse/stringify payloads, convert casing, and render template strings.
  - **A/B Split Node**: Distribute traffic randomly by percentage for canary testing or mock variances.
  - **Delay Node**: Simulate real-world network latency or asynchronous throttling.
  - **Response Node**: Return custom status codes, dynamic JSON, XML, or plain text with customizable response headers.
- 🔗 **Isolated Namespace URLs**: Endpoints are isolated per account using secure short hashes (`/{userHash}/{slug}`).
- 📊 **Real-time API Hit Analytics**: Built-in interactive SVG time-series charts (24h, 7d, 30d) showing request counts, status code distribution (2xx, 4xx, 5xx), and average latency.
- 🧩 **Shared Functions**: Reusable logic flows that can be composed and referenced across multiple endpoints.
- 📚 **Interactive API Documentation (`/docs`)**: Built-in documentation guide complete with live copyable code snippets for **cURL**, **JavaScript (Fetch)**, **Python (Requests)**, and **PHP (cURL)**.
- 🛡️ **Superadmin Panel & Support Settings**: User monitoring, system statistics, and dynamic support configuration (Telegram, WhatsApp, Email, Docs).
- 🌗 **Light / Dark Mode**: Fluid 1-click theme switching optimized for long developer sessions.

---

## 🏗️ Architecture

```
opensandbox/
├── apps/
│   ├── api/             # Hono + Drizzle ORM + Flow Execution Engine
│   │   ├── src/
│   │   │   ├── db/      # PostgreSQL schema, migrations, and seed scripts
│   │   │   ├── engine/  # Visual Flow execution interpreter
│   │   │   └── routes/  # Auth, Endpoints, Analytics, Settings, Superadmin
│   │   └── Dockerfile   # Bun-based container image
│   └── web/             # Next.js 14 App Router + React Flow + Tailwind CSS
│       ├── src/
│       │   ├── app/     # Dashboard, Endpoints, Flow Builder, Docs, Admin
│       │   ├── components/
│       │   └── lib/     # API client & auth helpers
│       └── Dockerfile   # Next.js container image
├── packages/
│   └── types/           # Shared TypeScript interfaces
├── docker-compose.yml   # Multi-container local orchestration
└── package.json         # Bun workspace manager
```

---

## 🚀 Quick Start

You can run OpenSandbox locally using either **Docker Compose** (recommended for instant evaluation) or **Bun**.

### Method 1: 🐳 Docker Compose (Instant)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adysanjaya/opensandbox.git
   cd opensandbox
   ```

2. **Start the stack:**
   ```bash
   docker compose up -d
   ```

3. **Run database migrations & initial seed:**
   ```bash
   docker compose exec api bun run db:migrate
   docker compose exec api bun run db:seed
   ```

4. **Access OpenSandbox:**
   - Frontend UI: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:4000](http://localhost:4000)
   - Seeded Admin: `admin@example.com` / `admin123`

---

### Method 2: ⚡ Local Development with Bun

#### Prerequisites
- [Bun](https://bun.sh/) 1.2+ installed
- PostgreSQL 14+ running locally (or via Docker)

#### 1. Install Dependencies
```bash
bun install
```

#### 2. Configure Environment Variables
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` with your PostgreSQL connection string:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sandbox
JWT_SECRET=your-secure-random-jwt-key
PORT=4000
SUPERADMIN_EMAIL=admin@example.com
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WEB_URL=http://localhost:3000
NEXT_PUBLIC_SUPERADMIN_EMAIL=admin@example.com
```

#### 3. Run Migrations & Seed Data
```bash
bun run db:migrate
bun run db:seed
```

#### 4. Start Development Servers
```bash
bun run dev
```

Both services will launch concurrently:
- Web App: [http://localhost:3000](http://localhost:3000)
- API Service: [http://localhost:4000](http://localhost:4000)

---

## ⚙️ Environment Variables Reference

### Backend (`apps/api/.env`)
| Variable | Required | Default | Description |
|---|:---:|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | — | Secret key for signing user auth tokens |
| `PORT` | No | `4000` | Port for the API server |
| `WEB_URL` | No | `http://localhost:3000` | Frontend origin for CORS and OAuth redirects |
| `SUPERADMIN_EMAIL` | No | `admin@example.com` | Email automatically granted administrative privileges |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |

### Frontend (`apps/web/.env.local`)
| Variable | Required | Default | Description |
|---|:---:|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:4000` | URL of the backend API service |
| `NEXT_PUBLIC_WEB_URL` | No | `http://localhost:3000` | Public URL for metadata and OpenGraph |
| `NEXT_PUBLIC_SUPERADMIN_EMAIL` | No | — | Admin email for client navigation display |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID for frontend button |

---

## 📖 Production Deployment

For full production deployment on Ubuntu Server (PgBouncer, Nginx reverse proxy, SSL with Let's Encrypt, and PM2 systemd daemon), refer to our comprehensive [DEPLOYMENT.md](DEPLOYMENT.md) guide.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, development workflow, and pull request process.

---

## 🔒 Security

If you discover a potential vulnerability, please check our [SECURITY.md](SECURITY.md) for instructions on responsible disclosure.

---

## 📄 License

OpenSandbox is licensed under the [MIT License](LICENSE).  
Copyright © 2024–2026 Ady Sanjaya and OpenSandbox Contributors.
