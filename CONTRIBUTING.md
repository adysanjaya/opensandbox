# Contributing to OpenSandbox

Thank you for your interest in contributing to **OpenSandbox**! We welcome all contributions — bug fixes, documentation improvements, new visual flow node types, and feature enhancements.

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (v1.2 or higher)
- [Docker](https://www.docker.com/) & Docker Compose (for running PostgreSQL and local testing)
- [Git](https://git-scm.com/)

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/opensandbox.git
cd opensandbox
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Setup Environment Variables
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 4. Database Setup
Start a local PostgreSQL database (via Docker):
```bash
docker compose up -d postgres
```
Then run the database migrations and seeder:
```bash
bun run db:migrate
bun run db:seed
```

### 5. Start Development Servers
```bash
bun run dev
```
- Web UI: [http://localhost:3000](http://localhost:3000)
- API Server: [http://localhost:4000](http://localhost:4000)

Default seeded credentials:
- **Email:** `admin@example.com`
- **Password:** `admin123`

---

## 📁 Repository Structure

```
opensandbox/
├── apps/
│   ├── api/             # Backend REST API (Hono + Drizzle ORM + Flow Engine)
│   └── web/             # Frontend Dashboard & Visual Builder (Next.js 14 + React Flow)
├── packages/
│   └── types/           # Shared TypeScript types between API and Web
├── docker-compose.yml   # Multi-container orchestration
└── package.json         # Workspace root scripts
```

---

## 🌿 Branching & Git Conventions

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` A new feature
   - `fix:` A bug fix
   - `docs:` Documentation only changes
   - `style:` Changes that do not affect the meaning of the code
   - `refactor:` A code change that neither fixes a bug nor adds a feature
   - `perf:` A code change that improves performance
   - `test:` Adding missing tests or correcting existing tests
   - `chore:` Changes to the build process or auxiliary tools

---

## 🧪 Testing Your Changes

Before submitting a Pull Request, ensure that typechecks and builds pass without errors:

```bash
# Typecheck API
bun run build:api

# Build Web frontend
bun run build:web
```

---

## 📬 Submitting a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch.
3. Fill out the PR template completely with details about your changes and verification steps.
4. Ensure CI tests pass.
5. Address any review comments or feedback.

Thank you for helping make OpenSandbox better!
