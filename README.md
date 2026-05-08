# Xiza Bot

Bot de Discord para el server de amigos **Gmi2**. Originalmente conocido como BotitoV2.

Hosteado en [Railway](https://railway.app/), deploy automático en cada push a `master`.

[![CI](https://github.com/Xiza73/BotitoV2/actions/workflows/ci.yml/badge.svg)](https://github.com/Xiza73/BotitoV2/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-284%2F284-brightgreen)

---

## Comandos (24)

| Categoría | Comandos |
|---|---|
| **info** (8) | `/about` · `/changelog` · `/channel-id` · `/feedback` · `/gmi2` · `/help` · `/ping` · `/uptime` |
| **fun** (9) | `/ahorcado` · `/flip` · `/imc` · `/love` · `/poke` · `/roll` · `/ruleta` · `/shuffle` · `/team` |
| **mod** (7) | `/clear` · `/cum` · `/cums` · `/nextcum` · `/register` · `/say` · `/who` |

Para ver el detalle de cualquier comando dentro del bot: `/help command:<nombre>`.

### Highlights

- **Cumpleaños persistentes** con cron diario que saluda automáticamente.
- **`/love`** con persistencia en Mongo y subcomandos owner para curar overrides (`set` / `reset`).
- **`/help`** con autocomplete, dropdown y botón "Volver al listado".
- **`/clear`** que DMea al moderador un recap con texto y archivos de los mensajes eliminados.
- **`/poke`** que matchea el color del embed con el tipo del Pokémon.
- **`/team`** divide listas en N equipos balanceados (round-robin).

---

## Stack

| Capa | Tech |
|---|---|
| Runtime | Node 22 |
| Lenguaje | TypeScript 5.9 |
| Discord | discord.js 14 |
| Base de datos | MongoDB + Mongoose 8 |
| HTTP server | Express 4 (health-check para Railway) |
| Tests | Vitest 4 + mongodb-memory-server |
| Package manager | pnpm 10 |
| Deploy | Railway (CD desde `master`) |

---

## Setup

```bash
pnpm install
cp .env.example .env  # configurar TOKEN, MONGODB, OWNERID, GMI2_CHANNEL, etc.
pnpm dev              # tsx watch — recarga al guardar
```

### Env vars relevantes

| Var | Default | Descripción |
|---|---|---|
| `TOKEN` | — | Token del bot de Discord |
| `MONGODB` | — | Connection string de Mongo |
| `OWNERID` | — | Discord ID del owner del bot (para comandos owner-only) |
| `GMI2_CHANNEL` | — | ID del canal principal del server (para crons y listeners) |
| `PORT` | `3000` | Puerto Express (Railway lo usa para health-check) |
| `MAX_DELETE_MESSAGES` | `20` | Cap de `/clear` |
| `PHOTO_ROOT` | — | Base URL de Cloudinary para GIFs/imágenes |

---

## Scripts

| Script | Acción |
|---|---|
| `pnpm dev` | `tsx watch src/index.ts` — desarrollo con hot reload |
| `pnpm build` | `rimraf dist && tsc -p .` |
| `pnpm start` | `node dist/index.js` — producción |
| `pnpm test` | `vitest run` — suite completa |
| `pnpm test:watch` | `vitest` — modo interactivo |

---

## Estructura del repo

```
src/
├── index.ts                 # Entry: levanta Express + Discord client
├── discord.ts               # Setup del client (intents, partials, login)
├── database.ts              # Conexión a Mongo
├── config/                  # Env vars
├── api/                     # Express REST (reservada para dashboard futuro)
│   ├── app.ts
│   ├── router.ts
│   ├── routes/              # Manifest estático de routes
│   ├── controller/
│   ├── dao/                 # Acceso directo a Mongo
│   └── models/              # Schemas Mongoose
├── slashCommands/           # Slash commands organizados por categoría
│   ├── index.ts             # Manifest estático
│   ├── fun/                 # 9 comandos
│   ├── info/                # 8 comandos
│   └── mod/                 # 7 comandos
├── events/                  # Discord event handlers
│   ├── index.ts             # Manifest estático
│   ├── client/              # ready, interactionCreate
│   └── message/             # messageDelete, messageUpdate
├── handlers/                # Boot loaders + ErrorHandler
└── shared/
    ├── classes/             # ClientDiscord (extiende Client de discord.js)
    ├── constants/           # branding, changelog, calendar
    ├── data/                # Datos estáticos (palabras de hangman, etc.)
    ├── services/            # Wrappers sobre DAOs (unwrappean ResponseData)
    ├── types/               # Tipos compartidos
    └── utils/               # Helpers (shuffle, formatUptime, dateToUTC5, …)
```

---

## Convenciones

Reglas detalladas para contribuir: [`.claude/conventions.md`](.claude/conventions.md).

Resumen rápido:

- Branches: `feature → dev → master`. `master` es release-only.
- Commits: conventional commits (`feat`, `fix`, `chore`, `refactor`, `test`, `docs`).
- Strings del bot al usuario: español neutral (tuteo). Voseo solo en chat dev/comments.
- Branding de embeds: sin `setAuthor`, footer `Xiza Bot vX.Y.Z`, color por categoría.
- Tests co-locados (`*.test.ts` al lado del source).
- DAO directo: los slash commands consumen `dao/*` o `services/*`, NUNCA hacen HTTP a la propia API.

---

## Versión actual

Ver [`/changelog`](src/shared/constants/changelog.ts) o el comando `/changelog` dentro del bot.

**v0.4.0** — Facelift completo de los 18 comandos heredados + 6 comandos nuevos. 284 tests.
