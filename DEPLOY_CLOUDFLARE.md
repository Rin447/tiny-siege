# Cloudflare deploy

Windows users can use the included batch files in this order:

1. `01-SETUP-CLOUDFLARE.bat`
2. `02-LOGIN-CLOUDFLARE.bat`
3. `03-DEPLOY-CLOUDFLARE.bat`

The deploy batch runs the source check and tests before `wrangler deploy`.
The Worker name is `tiny-siege`, static files come from `public/`, and room state uses the `BATTLES` Durable Object.

If `public/index.html` is edited manually, `npm run check` regenerates `src/game-core.js` before validation.
