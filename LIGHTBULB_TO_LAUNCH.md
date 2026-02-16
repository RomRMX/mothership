# 💡 Lightbulb to Launch: The Antigravity Greenfield Protocol

This guide defines the "Mothership Way" to take a raw idea and turn it into a production-ready application within this monorepo.

---

## Phase 0: The Blueprint (The Idea)

Before touching code, define the **Core Loop** and the **Namespace**.

1. **Name your Namespace**: Every project in the Mothership needs a unique, lowercase slug (e.g., `groundcommand`, `tubevault`).
2. **Define the Core Loop**: What is the one thing this app does? (e.g., "Manage service territories on a map").
3. **Plan the Schema**: Sketch out your tables. In the Mothership, we don't dump everything into `public`. We give every app its own private room (a Postgres Schema).

---

## Phase 1: The Soul (Database Architecture)

We build the database first. This ensures our data model is solid before we fight with UI.

1. **Create the Schema**:
    Log into Supabase and run this in the SQL Editor:

    ```sql
    CREATE SCHEMA [your_namespace];
    ```

2. **Grant Access**:
    Supabase needs permission to "see" your new schema and serve it via API.

    ```sql
    GRANT USAGE ON SCHEMA [your_namespace] TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA [your_namespace] TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA [your_namespace] GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ```

3. **Expose the API**:
    - Go to **Settings -> API -> Exposed schemas**.
    - Add `[your_namespace]` to the list and click **Save**.

---

## Phase 2: The Body (Code Scaffolding)

Now we create the container for your code.

1. **Scaffold with Vite**:

    ```bash
    cd apps
    npm create vite@latest [your_namespace] -- --template react-ts
    ```

2. **Monorepo Alignment**:
    - Rename `package.json` name to `@antigravity/[your_namespace]`.
    - Link shared packages from the root:

    ```bash
    npm install @antigravity/ui @antigravity/database @antigravity/utils -w @antigravity/[your_namespace]
    ```

3. **Initialize the Engine**:
    Create `src/lib/supabase.ts` and set the schema explicitly:

    ```typescript
    import { createClient } from '@supabase/supabase-js';
    export const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { db: { schema: '[your_namespace]' } }
    );
    ```

---

## Phase 3: The Spark (Iteration)

This is where the magic happens. Use `npx turbo dev` to iterate.

- **UI**: Use `@antigravity/ui` components to keep the look consistent.
- **Logic**: Keep "heavy" logic in `packages/utils` if it might be useful elsewhere.
- **Data**: Build your UI against the tables you created in Phase 1.

---

## Phase 4: Lift Off (Vercel Deployment)

Make it live.

1. **Vercel Config**: Add a `vercel.json` in your app folder.
2. **Link and Deploy**:

    ```bash
    npx vercel link
    npx vercel env add VITE_SUPABASE_URL production
    npx vercel env add VITE_SUPABASE_ANON_KEY production
    npx vercel deploy --prod
    ```

---

## 👽 Pro-Tip: The "Agent Handoff"

If you are asking an AI agent (like me) to build the app for you:

1. Hand them the **Namespace**.
2. Hand them the **Core Loop** description.
3. Show them this guide and **AGENTS.md**.

---

## 🛰️ The "Mothership Sync" (Working Across Devices)

To continue working on a project like `groundcommand` or `tubevault` on your laptop, follow this workflow:

1. **Clone the Repo**:
    On your laptop, clone the project from GitHub:

    ```bash
    git clone https://github.com/RomRMX/mothership.git
    cd mothership
    ```

2. **Install Dependencies**:

    ```bash
    npm install
    ```

3. **Check Environment Variables**:
    Copy `.env.example` to `.env` and ensure your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present.

4. **Iterate & Push**:
    As you work on your laptop, use the **Push-to-Deploy** strategy:
    - Create a branch: `git checkout -b feature/laptop-updates`
    - Commit and push: `git push origin feature/laptop-updates`
    - **Verify**: Check the Vercel Preview URL directly on your laptop (or phone!) to see the changes.

5. **Sync Back**:
    When you're back on your main desktop, just run:

    ```bash
    git pull origin main
    ```

**Ready to start? Tell me your lightbulb idea!**
