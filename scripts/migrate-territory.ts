import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const SOURCE_CONFIG = {
    user: 'postgres.bawunjbwrdvnzqkozvgr',
    password: 'JGGGte3HPw8AdUI3', // From user
    host: 'aws-1-us-east-2.pooler.supabase.com', // Confirmed working
    port: 6543,
    database: 'postgres'
};

const DEST_CONNECTION_STRING = process.env.DATABASE_URL;

if (!DEST_CONNECTION_STRING) {
    console.error('❌ Missing DATABASE_URL (Destination) in .env');
    process.exit(1);
}

async function migrate() {
    console.log('--- Territory Migration Started ---');
    console.log('Source:', SOURCE_CONFIG.host);
    console.log('Target Schema: territory');

    const source = new Client({
        connectionString: `postgresql://${SOURCE_CONFIG.user}:${SOURCE_CONFIG.password}@${SOURCE_CONFIG.host}:${SOURCE_CONFIG.port}/postgres`,
        ssl: { rejectUnauthorized: false }
    });

    const dest = new Client({
        connectionString: DEST_CONNECTION_STRING
    });

    try {
        await source.connect();
        await dest.connect();
        console.log('✅ Connected to both databases.');

        // 1. Create Schema
        await dest.query('CREATE SCHEMA IF NOT EXISTS "territory";');
        console.log('✅ Schema "territory" ensured.');

        // 2. Create Tables

        // Clients
        await dest.query(`
            CREATE TABLE IF NOT EXISTS "territory"."clients" (
                "id" text PRIMARY KEY,
                "name" text,
                "city" text,
                "state" text,
                "revenue" numeric,
                "lat" double precision,
                "lng" double precision,
                "details" jsonb,
                "updated_at" timestamptz,
                "last_interaction_at" timestamptz,
                "created_at" timestamptz DEFAULT now()
            );
        `);
        console.log('✅ Table "clients" ensured.');

        // Tasks
        await dest.query(`
            CREATE TABLE IF NOT EXISTS "territory"."tasks" (
                "id" text PRIMARY KEY,
                "title" text,
                "description" text,
                "priority" text,
                "card_type" text,
                "stage_id" text,
                "client_id" text REFERENCES "territory"."clients"("id"),
                "color" text,
                "position" integer,
                "created_at" timestamptz,
                "updated_at" timestamptz,
                "tags" text[]
            );
        `);
        console.log('✅ Table "tasks" ensured.');

        // 3. Migrate Data

        // Migrate Clients
        console.log('Running Clients Migration...');
        const clientsRes = await source.query('SELECT * FROM "clients"');
        let clientCount = 0;
        for (const row of clientsRes.rows) {
            await dest.query(`
                INSERT INTO "territory"."clients" 
                (id, name, city, state, revenue, lat, lng, details, updated_at, last_interaction_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
            `, [
                row.id, row.name, row.city, row.state, row.revenue,
                row.lat, row.lng, row.details, row.updated_at, row.last_interaction_at
            ]);
            clientCount++;
        }
        console.log(`✅ Migrated ${clientCount} clients.`);

        // Migrate Tasks
        console.log('Running Tasks Migration...');
        const tasksRes = await source.query('SELECT * FROM "tasks"');
        let taskCount = 0;
        for (const row of tasksRes.rows) {
            await dest.query(`
                INSERT INTO "territory"."tasks" 
                (id, title, description, priority, card_type, stage_id, client_id, color, position, created_at, updated_at, tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (id) DO NOTHING
            `, [
                row.id, row.title, row.description, row.priority, row.card_type,
                row.stage_id, row.client_id, row.color, row.position,
                row.created_at, row.updated_at, row.tags
            ]);
            taskCount++;
        }
        console.log(`✅ Migrated ${taskCount} tasks.`);

    } catch (err: any) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await source.end();
        await dest.end();
    }
}

migrate();
