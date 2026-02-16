import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL is not set in .env");
    process.exit(1);
}

async function setupAmpMatch() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log("✅ Connected to Supabase");

        // 1. Create Schema
        console.log("🚀 Creating 'ampmatch' schema...");
        await client.query(`CREATE SCHEMA IF NOT EXISTS ampmatch;`);

        // 2. Create Products Table
        console.log("📦 Creating 'products' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS ampmatch.products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sku TEXT UNIQUE NOT NULL,
                brand TEXT,
                model TEXT,
                msrp TEXT,
                dealer TEXT,
                category TEXT,
                specs JSONB,
                tags TEXT[],
                data_source TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // 3. Grant Permissions
        console.log("🔐 Granting permissions...");
        await client.query(`GRANT USAGE ON SCHEMA ampmatch TO anon, authenticated, service_role;`);
        await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA ampmatch TO anon, authenticated, service_role;`);
        await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ampmatch GRANT ALL ON TABLES TO anon, authenticated, service_role;`);

        // 4. Seed Data
        const inventoryPath = path.resolve('apps/ampmatch/src/data/unified_inventory.json');
        if (fs.existsSync(inventoryPath)) {
            console.log("🌱 Seeding products from unified_inventory.json...");
            const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

            for (const item of inventory) {
                try {
                    await client.query(`
                        INSERT INTO ampmatch.products (sku, brand, model, msrp, dealer, category, specs, tags, data_source)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        ON CONFLICT (sku) 
                        DO UPDATE SET 
                            brand = EXCLUDED.brand,
                            model = EXCLUDED.model,
                            msrp = EXCLUDED.msrp,
                            dealer = EXCLUDED.dealer,
                            category = EXCLUDED.category,
                            specs = EXCLUDED.specs,
                            tags = EXCLUDED.tags,
                            data_source = EXCLUDED.data_source,
                            updated_at = NOW();
                    `, [
                        item.sku,
                        item.brand,
                        item.model,
                        item.msrp,
                        item.dealer,
                        item.category,
                        item.specs,
                        item.tags,
                        item.data_source
                    ]);
                } catch (e) {
                    console.error(`❌ Failed to seed SKU: ${item.sku}`, e.message);
                }
            }
            console.log(`✅ Seeded ${inventory.length} products.`);
        } else {
            console.warn("⚠️ unified_inventory.json not found at expected path.");
        }

        console.log("\n🚀 AMPMATCH IGNITE: DATABASE READY");
        console.log("👉 REMEMBER: Expose 'ampmatch' schema in Supabase Dashboard (Settings -> API).");

    } catch (err) {
        console.error("❌ Setup failed:", err);
    } finally {
        await client.end();
    }
}

setupAmpMatch();
