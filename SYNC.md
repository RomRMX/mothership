# 🛰️ Mothership Sync Guide

Use this guide to keep your projects in sync between your desktop and laptop.

## 1. Initial Setup (Laptop)

If you haven't cloned the project yet:

```bash
git clone https://github.com/RomRMX/mothership.git
cd mothership
npm install
```

## 2. Environment Variables

Ensure your `.env` file exists in the root:

```bash
cp .env.example .env
```

*Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase dashboard.*

## 3. Working Workflow

Always work on a branch to keep `main` clean and trigger Vercel Previews.

**On Laptop:**

```bash
git checkout -b feature/your-feature
# ... make changes ...
git add .
git commit -m "feat: your update"
git push origin feature/your-feature
```

## 4. Syncing Back (Desktop)

When you return to your main machine:

```bash
git pull origin main
```

## 5. Deployment

- **Preview**: Every push to a branch creates a Vercel Preview URL.
- **Production**: Merging to `main` deploys to production.
