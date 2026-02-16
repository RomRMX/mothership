import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const config = {
    user: 'postgres.bawunjbwrdvnzqkozvgr',
    password: 'JGGGte3HPw8AdUI3',
    host: 'aws-0-us-west-1.pooler.supabase.com', // Trying west-1 first based on TubeVault, will fallback if needed
    port: 6543,
    database: 'postgres'
};

const hosts = [
    // Direct Connection (Best for migrations if unpaused)
    { host: 'db.bawunjbwrdvnzqkozvgr.supabase.co', port: 5432, user: 'postgres' },
    // Correct Region from Dashboard (AWS-1)
    { host: 'aws-1-us-east-2.pooler.supabase.com', port: 6543, user: 'postgres.bawunjbwrdvnzqkozvgr' },
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: 'postgres.bawunjbwrdvnzqkozvgr' },
];

async function inspect() {
    console.log('--- Connecting to OLD Territory DB ---');

    for (const cfg of hosts) {
        console.log(`Trying ${cfg.host}...`);
        const client = new Client({
            connectionString: `postgresql://${cfg.user}:${config.password}@${cfg.host}:${cfg.port}/postgres`,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            console.log('✅ Connected!');

            // 1. Get Tables
            const tablesRes = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            const tables = tablesRes.rows.map(r => r.table_name);
            console.log('Found Tables:', tables);

            // 2. Get Columns/DDL for each table
            for (const table of tables) {
                console.log(`\n--- Schema for ${table} ---`);
                const colsRes = await client.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = $1
                    ORDER BY ordinal_position
                `, [table]);

                console.table(colsRes.rows);

                // Count rows
                const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
                console.log(`Row count: ${countRes.rows[0].count}`);
            }

            await client.end();
            return;

        } catch (err: any) {
            console.error(`❌ Failed ${cfg.host}:`, err.message);
            await client.end();
        }
    }
}

inspect();
