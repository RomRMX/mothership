# Agent Instructions 🛸

> This file is mirrored across GEMINI.md, AGENTS.md, and CLAUDE.md so the same instructions load in any AI environment.

You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas most business logic is deterministic and requires consistency. This system fixes that mismatch.

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**  

- Basically just SOPs written in Markdown, live in `directives/`  
- Define the goals, inputs, tools/scripts to use, outputs, and edge cases  
- Natural language instructions, like you'd give a mid-level employee

**Layer 2: Orchestration (Decision making)**  

- This is you. Your job: intelligent routing.  
- Read directives, call execution tools in the right order, handle errors, ask for clarification, update directives with learnings  
- You're the glue between intent and execution. E.g you don't try scraping websites yourself—you read `directives/scrape_website.md` and come up with inputs/outputs and then run `execution/scrape_single_site.py`

**Layer 3: Execution (Doing the work)**  

- Deterministic Python scripts in `execution/`  
- Environment variables, api tokens, etc are stored in `.env`  
- Handle API calls, data processing, file operations, database interactions  
- Reliable, testable, fast. Use scripts instead of manual work. Commented well.

## 🌌 Mothership Monorepo Rules

Since you are working inside the **Antigravity Mothership**, you MUST follow these additional directives:

### 1. Git & Version Control

- **NO NESTED REPOS**: Do not run `git init` inside any subdirectory.
- The entire `mothership` folder is a single repository.
- Commit your changes to the main repository.

### 2. Database (Supabase)

- **UNIFIED INSTANCE**: Use the primary Mothership Supabase project.
- **SCHEMAS (NAMESPACES)**: Do not use the `public` schema for app-specific tables.
- Create or use a dedicated Postgres Schema named after your app (e.g., `mobthresh`).
- All queries should be prefixed: `select * from mobthresh.table_name`.

### 3. Vercel & Deployment

- **ROOT DIRECTORY**: When configuring Vercel, link to the `mothership` repo but set the "Root Directory" to your specific folder (e.g., `apps/mobthresh`).
- DO NOT create a standalone `vercel.json` in your app folder that conflicts with the root.

### 4. Shared Packages

- **DRY (Don't Repeat Yourself)**: Check `packages/` for shared logic.
- Import from `@antigravity/ui` for design components.
- Import from `@antigravity/database` for client initialization.

### 5. Directory Structure

- Always place your application code in `apps/`.
- Always place reusable logic in `packages/`.
- Intermediates go in `.tmp/` (never commit).

---

## Operating Principles

**1. Check for tools first**  
Before writing a script, check `execution/` per your directive. Only create new scripts if none exist.

**2. Self-anneal when things break**  

- Read error message and stack trace  
- Fix the script and test it again  
- Update the directive with what you learned (API limits, timing, edge cases)

**3. Update directives as you learn**  
Directives are living documents. When you discover API constraints, better approaches, common errors, or timing expectations—update the directive.

## Summary

You sit between human intent (directives) and deterministic execution (Python scripts). Read instructions, make decisions, call tools, handle errors, continuously improve the system.

Be pragmatic. Be reliable. Self-anneal.
