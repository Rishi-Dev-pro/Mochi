# Production Deployment & Infrastructure Strategy 🚀

This document outlines the production deployment setup, serverless backend architecture, environment configuration, health monitoring, and rollback procedures for the **Mochi AI Companion**.

---

## 1. Production Architecture Overview

Mochi is deployed using a decoupled serverless hosting model:

```
[ DNS & CDN Edge (Cloudflare / Vercel Edge) ]
                      |
                      v
     +----------------------------------+
     |   Frontend Host (Vercel / Netlify) |  <-- Static React + Vite Bundle
     +----------------------------------+
                      |
         +------------+------------+
         |                         |
         v                         v
+------------------+     +------------------------+
| Supabase Cloud   |     | Anthropic Claude API   |
| (DB, Auth, RLS)  |     | (LLM Engine)           |
+------------------+     +------------------------+
         ^
         |
+------------------------------------+
| Supabase Edge Functions (Deno)     |  <-- Secure Claude API Proxy & Webhooks
+------------------------------------+
```

---

## 2. Frontend Deployment (Vercel / Netlify)

### 2.1 Deploying on Vercel (Recommended)

1. **Connect Repository**: Import the `mochi` GitHub repository in your Vercel Dashboard.
2. **Framework Preset**: Select **Vite**.
3. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Environment Variables**: Add all production environment variables listed in Section 4.

#### `vercel.json` Configuration
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## 3. Backend Deployment (Supabase Edge Functions)

Backend logic (such as secure Anthropic API proxies and sentiment extractors) is deployed to **Supabase Edge Functions** (Deno runtime).

```bash
# Link local project to Supabase production project
supabase link --project-ref YOUR_SUPABASE_PROJECT_REF

# Deploy chat proxy edge function
supabase functions deploy chat --no-verify-jwt

# Set secure secrets for Edge Functions (Not exposed to client)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-PROD_KEY_HERE
```

---

## 4. Production Environment Variables Checklist

Ensure these variables are configured in your Vercel/Netlify dashboard:

| Variable Name | Environment | Description / Secret Status |
| :--- | :--- | :--- |
| `VITE_APP_ENV` | `production` | Set application mode to production. |
| `VITE_APP_URL` | `https://mochi.yourdomain.com` | Production canonical web URL. |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Production Supabase database endpoint. |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Public Supabase client key (RLS protected). |
| `VITE_ENABLE_WEBCAM_MOTION` | `true` | Enable vision pipeline feature flag. |
| `VITE_ENABLE_TTS` | `true` | Enable speech synthesis feature flag. |

> ⚠️ **SECURITY WARNING**: `ANTHROPIC_API_KEY` must **NEVER** be prefixed with `VITE_` in production. It must remain stored exclusively in Supabase Edge Secrets.

---

## 5. Monitoring & Error Tracking Strategy

### 5.1 Real-Time Application Performance Monitoring
- **Sentry Integration**: Capture client-side JavaScript, WebGL canvas context losses, and unhandled promise rejections.
- **Vercel Analytics**: Track Core Web Vitals (LCP, FID, CLS) and regional latency.

### 5.2 Serverless Log Inspection
- Monitor Supabase Edge Function logs via CLI:
  ```bash
  supabase functions logs chat --tail
  ```

---

## 6. Rollback & Disaster Recovery Plan

### 6.1 Instant Frontend Rollback
Vercel maintains instant immutable deployments for every Git commit:
1. Open Vercel Dashboard -> **Deployments**.
2. Locate the last stable deployment build.
3. Click `...` -> **Promote to Production**. (Rollback takes `< 5 seconds`).

### 6.2 Database Migration Rollback
If a database migration introduces breaking schema changes:
```bash
# Revert to target migration timestamp
supabase db rollback --target <MIGRATION_TIMESTAMP>
```

---

## 🔗 Related Documentation
- 📖 [Project Overview README](README.md)
- ⚙️ [Developer Setup Guide](SETUP.md)
- 🔌 [API Specs](API.md)
- 💾 [Database & RLS Specs](DATABASE.md)
