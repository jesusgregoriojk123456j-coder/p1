const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
    })
    : new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'sigelab_db',
        password: process.env.DB_PASSWORD || '12345',
        port: Number(process.env.DB_PORT) || 5432,
    });

module.exports = pool;