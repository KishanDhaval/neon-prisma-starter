# neon-prisma-starter

> Instantly scaffold a Node.js + Prisma + Neon (serverless Postgres) project with one command.
> Supports both **TypeScript** and **JavaScript**.

## ⚠️ Version Requirements

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | v18+ | Required by Prisma 7 |
| **Prisma** | v7.2.0 | Auto-installed. v7.2.0+ required so `prisma generate` works without a URL at scaffold time |
| **@prisma/adapter-neon** | v7.2.0 | Auto-installed. Must match Prisma version |
| **Neon account** | Free tier works | Get connection strings from neon.tech |

> **Why Prisma 7.2.0?**
> - Prisma 6: `url` in `schema.prisma` is deprecated when using driver adapters
> - Prisma 6.19: removes `url` but `prisma generate` still fails without DATABASE_URL
> - Prisma 7.2.0: `prisma generate` works without DATABASE_URL being set ✅

## Usage

```bash
npx neon-prisma-starter my-project
```

## Interactive Prompts

```
✔ Project name:    my-project
✔ Select language: ● TypeScript  ○ JavaScript
✔ DATABASE_URL:    postgresql://...-pooler...  (pooled, for app)
✔ DIRECT_URL:      postgresql://...            (direct, for Prisma CLI)
```

Both URLs from: **Neon Console → Your Project → Connect**

## What gets created

```
my-project/
├── prisma/
│   ├── schema.prisma       ← User model (no url in datasource)
│   └── seed.js / seed.ts
├── src/
│   ├── generated/prisma/   ← auto-generated
│   ├── db.js / db.ts       ← uses DATABASE_URL (pooled)
│   └── index.js / index.ts ← Express CRUD API
├── prisma.config.js / .ts  ← uses DIRECT_URL (for CLI)
├── .env
└── package.json
```

## After scaffolding

```bash
cd my-project
npm run generate   # generate Prisma client
npm run migrate    # create tables in Neon
npm run seed       # seed example users
npm run dev        # start server on :3000
```

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | /users | List all users |
| POST | /users | Create `{ name, email, password }` |
| GET | /users/:id | Get by ID |
| PUT | /users/:id | Update user |
| DELETE | /users/:id | Delete user |

## How the two URLs work

| Variable | Type | Used by |
|---|---|---|
| `DATABASE_URL` | Pooled (`-pooler` in hostname) | App runtime → `db.js` |
| `DIRECT_URL` | Direct (no `-pooler`) | Prisma CLI → `prisma.config.js` |

## License

MIT
