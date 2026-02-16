import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const DEST_CONNECTION_STRING = process.env.DATABASE_URL;

if (!DEST_CONNECTION_STRING) {
    console.error('❌ Missing DATABASE_URL');
    process.exit(1);
}

async function fixPermissions() {
    console.log('--- Fixing Territory Permissions ---');

    const client = new Client({ connectionString: DEST_CONNECTION_STRING });

    try {
        await client.connect();

        // 1. Grant Usage on Schema
        await client.query('GRANT USAGE ON SCHEMA "territory" TO postgres, anon, authenticated, service_role;');
        console.log('✅ Granted USAGE on schema.');

        // 2. Grant Table Permissions
        await client.query('GRANT ALL ON ALL TABLES IN SCHEMA "territory" TO postgres, anon, authenticated, service_role;');
        console.log('✅ Granted ALL on existing tables.');

        // 3. Grant Future Table Permissions (Optional but good)
        await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA "territory" GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;');
        console.log('✅ Granted Default Privileges.');

    } catch (err: any) {
        console.error('❌ Failed:', err);
    } finally {
        await client.end();
    }
}

fixPermissions();
