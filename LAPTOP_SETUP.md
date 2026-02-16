# Setup Instructions for New Laptop

Follow these steps to continue working on the **Mothership** project on your new machine.

## 1. Prerequisites

Ensure you have the following installed on your laptop:

- **Node.js**: Version 20 or higher ([Download](https://nodejs.org/))
- **Git**: Installed and configured with your GitHub account.
- **VS Code**: Or your preferred editor.

## 2. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/RomRMX/mothership.git
cd mothership
```

## 3. Install Dependencies

Run the following command from the root directory:

```bash
npm install
```

## 4. Recover Environment Variables

**Crucial Step**: Git ignores `.env` files for security. You must manually recreate them on your laptop.

### Option A: Manual Copy (Recommended if you have both machines)

Create the following files and copy the content from your current machine:

- Root: `.env`
- `apps/territory-v1/.env.local`
- `apps/groundcommand/.env.local`
- `apps/ideabox/.env.local`
- `apps/ampmatch/.env.local`
- `apps/rmxlabs/.env.local`

### Option B: Using Vercel CLI (If you don't have the old machine)

If you have Vercel CLI installed and authenticated:

```bash
npx vercel link
npx vercel env pull .env.local
```

## 5. Running the Projects

To start the development environment for all apps:

```bash
npm run dev
```

To run a specific app (e.g., IdeaBox):

```bash
npx turbo run dev --filter=ideabox
```

## 6. Accessing Supabase

Your database is hosted on Supabase. As long as your `.env` files contain the correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`, the apps will connect automatically.

---
**Note**: This file was generated on 2026-02-16 to assist with the migration.
