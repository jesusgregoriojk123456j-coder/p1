const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sigelab_db',
    password: '12345', // Cambia por tu contraseña
    port: 5432,
});

module.exports = pool;