# Cloudflare deployment

TINY SIEGE v46.0.0 uses Cloudflare Workers, Static Assets and a Durable Object named `BATTLES`.

## Requirements

- Node.js 22+
- npm
- Cloudflare account

## Local validation

```bash
npm install
npm run ci
```

## Cloudflare login

```bash
npx wrangler login
```

## Deploy

```bash
npm run deploy
```

The `predeploy` hook runs `npm run check`, which synchronizes `src/game-core.js` from the canonical `public/index.html` and validates the current v46 source before Wrangler uploads it.

Worker entry point: `src/worker.js`

Static asset directory: `public/`

Durable Object binding: `BATTLES`

## GitHub integration

This repository is ready to connect directly to a GitHub repository. GitHub Actions runs the source, unit and local-network checks on push and pull request. Cloudflare can either be deployed manually with `npm run deploy` or connected to the repository using Cloudflare's Git integration.
