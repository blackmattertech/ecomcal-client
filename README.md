# Tag Fees — Client

Mobile-first React PWA for the Amazon fee calculator.

## Local

```bash
npm install
npm run dev
```

With the API on `localhost:4000`, leave `VITE_API_URL` empty — Vite proxies `/api`.

## Go live (2 steps)

The client is static. It needs a **live server URL** via env.

### 1. Deploy the server first

Repo: [ecomcal-server](https://github.com/blackmattertech/ecomcal-server)

Example (Render / Railway / any Node host):

- Root: repo root  
- Start: `npm start`  
- Env (optional): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PORT`

Copy the public API URL, e.g. `https://ecomcal-server.onrender.com`

### 2. Deploy this client

Repo: [ecomcal-client](https://github.com/blackmattertech/ecomcal-client)

**Vercel (recommended)**

1. Import `blackmattertech/ecomcal-client`
2. Framework: Vite
3. Build: `npm run build` · Output: `dist`
4. Add env var:
   - Name: `VITE_API_URL`
   - Value: `https://YOUR-SERVER-URL` (no trailing slash)
5. Deploy

**Netlify:** same build/output; set `VITE_API_URL` in Site settings → Environment variables.

### Env

| Variable | Required in prod | Example |
| --- | --- | --- |
| `VITE_API_URL` | Yes | `https://ecomcal-server.onrender.com` |

Local: copy `.env.example` → `.env` only if you need to hit a remote API while developing.
