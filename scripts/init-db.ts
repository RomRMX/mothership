import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const schemas = ['rmxlabs', 'tubevault', 'trakkindemdollaz', 'rackstack'];
const password = process.env.VITE_SUPABASE_PW || 'QbjbxRcGtxatlTkV';
const projectRef = 'zfdwaapcaozrhjpafzmc';

// Try direct connection (port 5432)
// Direct: db.[ref].supabase.co
const directHost = `db.${projectRef}.supabase.co`;

// Comprehensive list of Supabase Poolers
const poolers = [
    'aws-0-us-west-1.pooler.supabase.com', // N. California
    'aws-0-us-west-2.pooler.supabase.com', // Oregon
    'aws-0-us-east-1.pooler.supabase.com', // N. Virginia
    'aws-0-us-east-2.pooler.supabase.com', // Ohio
    'aws-0-eu-central-1.pooler.supabase.com', // Frankfurt
    'aws-0-eu-west-1.pooler.supabase.com', // Ireland
    'aws-0-eu-west-2.pooler.supabase.com', // London
    'aws-0-ap-southeast-1.pooler.supabase.com', // Singapore
    'aws-0-sa-east-1.pooler.supabase.com', // Sao Paulo
];

async function tryConnect(host: string, port: number) {
    // Fix: Pooler username format is usually postgres.[ref] OR just postgres depending on config
    // For Supabase generic poolers, it is postgres.[ref]
    const user = port === 6543 ? `postgres.${projectRef}` : 'postgres';

    const connectionString = `postgresql://${user}:${password}@${host}:${port}/postgres`;
    console.log(`Trying ${host}:${port} as ${user}...`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log(`✅ Connected to ${host}!`);
        return client;
    } catch (err: any) {
        console.log(`❌ Failed ${host}:`, err.message || err);
        await client.end();
        return null;
    }
}

async function init() {
    console.log('--- Starting Database Initialization ---');
    let client: Client | null = null;

    // 1. Try Direct Connection
    client = await tryConnect(directHost, 5432);

    // 2. Try Poolers if direct fails
    if (!client) {
        for (const pooler of poolers) {
            client = await tryConnect(pooler, 6543);
            if (client) break;
        }
    }

    if (!client) {
        console.error('🔥 Could not connect to any known Supabase host. Please check password or region.');
        process.exit(1);
    }

    try {
        // Create Schemas
        for (const schema of schemas) {
            console.log(`Creating schema: ${schema}...`);
            await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
        }

        // Verify
        const res = await client.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = ANY($1::text[])
    `, [schemas]);

        const found = res.rows.map(r => r.schema_name);
        console.log(`✅ Verified Schemas: ${found.join(', ')}`);

    } catch (err) {
        console.error('Database Operation Error:', err);
    } finally {
        await client.end();
    }
}

init();
