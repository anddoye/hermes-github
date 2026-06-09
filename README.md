# 🧠 Hermes GitHub

> **GitHub API for Hermes Agent — Brain intelligence via GitHub Actions**

API REST Express.js TypeScript pour interagir avec l'écosystème GitHub et exécuter des modèles d'IA via GitHub Actions.

---

## ✨ Fonctionnalités

- 🔐 **Authentification GitHub** — Gestion des tokens, OAuth, validation
- 📦 **Repositories** — Lister, explorer les repos
- 🐛 **Issues** — CRUD complet, labels, assignees, commentaires
- 🔀 **Pull Requests** — Créer, lister, merger (merge/squash/rebase)
- ⚡ **Workflows** — Lister, déclencher, suivre, relancer, annuler
- 🤖 **Model Execution** — Exécuter des modèles IA via GitHub Actions
- 📊 **Rate Limiting** — Suivi et gestion des quotas API GitHub
- 🐳 **Docker** — Multi-stage build, production-ready
- 🔄 **CI/CD** — Pipeline GitHub Actions complet

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- Un [token GitHub](https://github.com/settings/tokens) avec les scopes `repo`, `workflow`, `read:org`

### Installation

```bash
# Cloner le repo
git clone https://github.com/anddoye/hermes-github.git
cd hermes-github

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec votre token GitHub

# Démarrer en développement
npm run dev
```

L'API est accessible sur **http://localhost:3000**

### Docker

```bash
docker-compose up -d
```

---

## 📡 API Endpoints

### 🔑 Auth

| Méthode | Endpoint              | Description                    |
|---------|-----------------------|--------------------------------|
| GET     | `/api/auth/status`    | Statut d'authentification      |
| POST    | `/api/auth/validate`  | Valider un token GitHub        |

### 🧠 Models (Brain)

| Méthode | Endpoint                              | Description                     |
|---------|---------------------------------------|---------------------------------|
| GET     | `/api/models/providers`               | Liste des providers & modèles   |
| POST    | `/api/models/execute`                 | Exécuter un modèle              |
| GET     | `/api/models/executions`              | Lister les exécutions           |
| GET     | `/api/models/executions/:id`          | Détail d'une exécution          |
| POST    | `/api/models/executions/:id/cancel`   | Annuler une exécution           |

### 📦 GitHub

| Méthode | Endpoint                                              | Description                |
|---------|-------------------------------------------------------|----------------------------|
| GET     | `/api/github/repos`                                   | Lister ses repos           |
| GET     | `/api/github/repos/:owner/:repo`                      | Détail d'un repo           |
| POST    | `/api/github/repos/:owner/:repo/issues`               | Créer une issue            |
| GET     | `/api/github/repos/:owner/:repo/issues`               | Lister les issues          |
| GET     | `/api/github/repos/:owner/:repo/issues/:number`       | Détail d'une issue         |
| PATCH   | `/api/github/repos/:owner/:repo/issues/:number`       | Modifier une issue         |
| POST    | `/api/github/repos/:owner/:repo/pulls`                | Créer une PR               |
| GET     | `/api/github/repos/:owner/:repo/pulls`                | Lister les PRs             |
| POST    | `/api/github/repos/:owner/:repo/pulls/:number/merge`  | Merger une PR              |
| GET     | `/api/github/repos/:owner/:repo/workflows`            | Lister les workflows       |
| POST    | `/api/github/repos/:owner/:repo/workflows/:id/dispatch`| Déclencher un workflow    |
| GET     | `/api/github/repos/:owner/:repo/workflows/runs`       | Lister les runs            |
| GET     | `/api/github/repos/:owner/:repo/workflows/runs/:id`   | Détail d'un run            |
| POST    | `/api/github/repos/:owner/:repo/workflows/runs/:id/rerun`| Relancer un run         |
| POST    | `/api/github/repos/:owner/:repo/workflows/runs/:id/cancel`| Annuler un run         |

### 💚 Health

| Méthode | Endpoint    | Description                        |
|---------|-------------|------------------------------------|
| GET     | `/health`   | Health check (uptime, rate limit)  |
| GET     | `/api`      | Documentation des endpoints        |

---

## 🧠 Exécution de modèles

```bash
# Exécuter un modèle
curl -X POST http://localhost:3000/api/models/execute \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "prompt": "Explain quantum computing in 3 sentences",
    "maxTokens": 500,
    "temperature": 0.7
  }'

# Suivre l'exécution
curl http://localhost:3000/api/models/executions/<execution-id>
```

### Providers supportés

| Provider   | Modèles                                        |
|------------|------------------------------------------------|
| OpenAI     | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| Anthropic  | claude-sonnet-4, claude-opus-4, claude-3.5-sonnet |
| Google     | gemini-2.0-flash, gemini-1.5-pro               |
| Meta       | llama-3.1-405b, llama-3.1-70b                   |
| Mistral    | mistral-large, mistral-medium                   |

---

## ⚙️ Configuration

Variables d'environnement disponibles dans `.env` :

| Variable               | Description                         | Défaut                    |
|------------------------|-------------------------------------|---------------------------|
| `GITHUB_TOKEN`         | Token GitHub (obligatoire)          | —                         |
| `PORT`                 | Port du serveur                     | `3000`                    |
| `NODE_ENV`             | Environnement                       | `development`             |
| `GITHUB_OWNER`         | Owner GitHub pour les workflows     | —                         |
| `GITHUB_REPO`          | Repo pour les workflows             | `hermes-github`           |
| `RATE_LIMIT_WINDOW_MS` | Fenêtre de rate limiting            | `900000` (15 min)         |
| `RATE_LIMIT_MAX`       | Requêtes max par fenêtre            | `100`                     |
| `LOG_LEVEL`            | Niveau de log                       | `info`                    |

---

## 🏗️ Structure du projet

```
hermes-github/
├── src/
│   ├── config/
│   │   └── github.ts              # Configuration GitHub & Octokit
│   ├── services/
│   │   ├── githubService.ts       # Service GitHub (issues, PRs, workflows)
│   │   └── modelService.ts        # Service d'exécution de modèles
│   ├── routes/
│   │   ├── auth.ts                # Endpoints d'authentification
│   │   ├── models.ts              # Endpoints de modèles (cerveau)
│   │   └── github.ts              # Endpoints GitHub
│   ├── middleware/
│   │   └── errorHandler.ts        # Gestion d'erreurs & logging
│   ├── types/
│   │   └── index.ts               # Types TypeScript
│   └── index.ts                   # Point d'entrée Express
├── .github/workflows/
│   └── ci.yml                     # Pipeline CI/CD
├── Dockerfile                     # Multi-stage build
├── docker-compose.yml             # Docker Compose
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 📄 Licence

MIT © anddoye
