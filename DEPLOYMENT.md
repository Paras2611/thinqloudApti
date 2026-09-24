# Deployment Guide: Vercel & Render
> **Thinqloud Aptitude Test Platform — Campus Placement Screening System**  
> *Author: Paras Jagadish Patil (`paras.jagadish.patil@gmail.com`) · Version 1.0.0*

This guide outlines the complete end-to-end production deployment instructions for the **Aptitude Test Platform** using **Render** (Backend API, PostgreSQL, Redis) and **Vercel** (React Vite Frontend).

---

## 1. High-Level Architecture

| Layer | Service Provider | Public/Internal URL Pattern | Purpose |
|---|---|---|---|
| **Frontend** | **Vercel** | `https://thinqloud-apti.vercel.app` | React 18 + Vite SPA (Candidate Runner + Admin Console) |
| **Backend API** | **Render** | `https://aptitude-api.onrender.com` | Node.js / Express REST API |
| **Realtime** | **Render (WebSockets)** | `wss://aptitude-api.onrender.com` | Socket.io real-time candidate live monitor |
| **Database** | **Render Postgres** | Internal Connection String | Sessions, Questions, Attempts, Audit Logs |
| **Cache** | **Render Redis** | Internal Connection String | Rate limiting and session caching |

---

## 2. All Environment Variables Reference

### Backend (Render Web Service)

| Variable | Required | Default / Example Value | Description | Where to Set |
|---|---|---|---|---|
| `PORT` | Auto | `10000` | HTTP port on Render | Managed automatically by Render |
| `NODE_ENV` | Yes | `production` | Runtime mode | `render.yaml` or Render Dashboard |
| `DATABASE_URL` | Auto | `postgresql://...` | PostgreSQL connection string | Linked from `aptitude-db` in `render.yaml` |
| `REDIS_URL` | Auto | `redis://...` | Redis connection string | Linked from `aptitude-redis` in `render.yaml` |
| `JWT_SECRET` | Yes | Auto-generated strong string | Key used to sign authentication JWT tokens | Auto-generated via `render.yaml` or manual |
| `ADMIN_EMAIL` | Yes | `paras.jagadish.patil@gmail.com` | Seed admin email provisioned on boot | Render Dashboard / `render.yaml` |
| `ADMIN_PASSWORD` | Yes | `2@Paras` | Seed admin password (hashed with bcrypt cost 12) | Set securely in Render Dashboard |
| `FRONTEND_URL` | Yes | `https://thinqloud-apti.vercel.app` | Allowed CORS origin (Vercel domain) | Set in Render Dashboard after Vercel deploy |

### Frontend (Vercel)

| Variable | Required | Example Value | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `https://aptitude-api.onrender.com` | Backend REST API root URL |
| `VITE_SOCKET_URL` | Yes | `wss://aptitude-api.onrender.com` | WebSocket endpoint for live monitoring |
| `VITE_APP_NAME` | Optional | `Thinqloud Aptitude Test Platform` | Display title shown across candidate interface |

---

## 3. Step-by-Step Deployment Procedure

### Step 1: Fork or Clone Repository
Ensure the repository is available on your GitHub account:
```bash
https://github.com/Paras2611/thinqloudApti
```

---

### Step 2: Deploy Backend to Render (Blueprint)

1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** and select **Blueprint**.
3. Connect your repository: `Paras2611/thinqloudApti`.
4. Render will detect the root [`render.yaml`](./render.yaml) file and provision:
   - **Web Service**: `aptitude-api` (Node 20)
   - **PostgreSQL Database**: `aptitude-db` (Free tier)
   - **Redis Instance**: `aptitude-redis` (Free tier)
5. In the initial setup prompt, supply the `ADMIN_PASSWORD` environment variable (e.g. `2@Paras`).
6. Click **Apply**.
7. Once deployed, note down your web service URL (e.g., `https://aptitude-api.onrender.com`).
8. Verify health status by visiting:
   ```
   https://aptitude-api.onrender.com/api/health
   ```
   Expected response:
   ```json
   { "status": "healthy", "version": "1.0.0" }
   ```

---

### Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/dashboard).
2. Click **Add New...** $\to$ **Project**.
3. Import your GitHub repository: `Paras2611/thinqloudApti`.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://<YOUR-RENDER-API-URL>` (e.g. `https://aptitude-api.onrender.com`)
   - `VITE_SOCKET_URL` = `wss://<YOUR-RENDER-API-URL>` (e.g. `wss://aptitude-api.onrender.com`)
   - `VITE_APP_NAME` = `Thinqloud Aptitude Platform`
6. Click **Deploy**.
7. Once the build finishes, copy your live Vercel URL (e.g. `https://thinqloud-apti.vercel.app`).

---

### Step 4: Configure CORS on Render

Because the frontend and backend are hosted on separate domains, allow requests from Vercel:

1. Go to your **Render Dashboard** $\to$ Select **aptitude-api**.
2. Navigate to the **Environment** tab.
3. Add or update the variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://<YOUR-VERCEL-APP-URL>` (e.g. `https://thinqloud-apti.vercel.app` - without trailing slash).
4. Click **Save Changes**. Render will automatically trigger a rolling redeploy.

---

### Step 5: Initial Administrator Login & Verification

1. Open your Vercel deployment URL in the browser:
   ```
   https://<YOUR-VERCEL-DOMAIN>/admin/login
   ```
2. Log in with the pre-seeded root credentials:
   - **Email**: `paras.jagadish.patil@gmail.com`
   - **Password**: `2@Paras`
3. Verify that the pre-seeded active test session appears on the **Session Manager** screen.
4. **Security Recommendation**: Change the admin password in the settings or via environment variable.

---

## 4. Configuration Files Reference

### Render Blueprint Configuration (`render.yaml`)

Located in repository root:
```yaml
services:
  - type: web
    name: aptitude-api
    env: node
    region: singapore
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm run start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: aptitude-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: aptitude-redis
          type: redis
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: ADMIN_EMAIL
        value: paras.jagadish.patil@gmail.com
      - key: ADMIN_PASSWORD
        sync: false
      - key: FRONTEND_URL
        sync: false

databases:
  - name: aptitude-db
    plan: free
    databaseName: aptitude_test
    user: aptitude_user

  - name: aptitude-redis
    type: redis
    plan: free
```

### Vercel Routing Configuration (`frontend/vercel.json`)

Located in `frontend/vercel.json`:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "env": {
    "VITE_APP_NAME": "Aptitude Test Platform"
  }
}
```

---

## 5. CI/CD Pipeline (GitHub Actions)

Continuous deployment is pre-configured via GitHub Actions workflows in `.github/workflows/`:

### Frontend Deployment (`.github/workflows/deploy-frontend.yml`)
Triggers on changes pushed to `frontend/**`:
- Requires GitHub repository secrets:
  - `VERCEL_TOKEN`: Vercel Personal Access Token
  - `VERCEL_ORG_ID`: Vercel Account / Team ID
  - `VERCEL_PROJECT_ID`: Vercel Project ID

### Backend Deployment (`.github/workflows/deploy-backend.yml`)
Triggers on changes pushed to `backend/**`:
- Requires GitHub repository secret:
  - `RENDER_DEPLOY_HOOK_URL`: Render Web Service Deploy Hook URL from Settings $\to$ Deploy Hook.

---

## 6. Troubleshooting & Gotchas

1. **CORS Error in Browser Console (`Access-Control-Allow-Origin`)**:
   - Ensure `FRONTEND_URL` on Render matches your exact Vercel URL (including `https://` without a trailing `/`).
2. **WebSockets Live Monitor Disconnected**:
   - Verify `VITE_SOCKET_URL` uses the `wss://` prefix for production HTTPS backends.
3. **Render Cold Starts on Free Tier**:
   - Free instances on Render spin down after 15 minutes of inactivity and take ~30-50 seconds to wake up on the first request. The `/api/health` endpoint can be pinged with an uptime monitor (e.g., UptimeRobot, Cron-job.org) every 10 minutes to keep it warm.
4. **Seed Database Initialization**:
   - The backend runs `autoSeed()` on initial startup automatically. If you ever need to re-seed questions manually, run:
     ```bash
     cd backend && node src/seed.js
     ```
