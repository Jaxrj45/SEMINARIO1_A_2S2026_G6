// Conexion a RDS (PostgreSQL) - esquema definido en database/schema.sql
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.RDS_HOST,
  port: process.env.RDS_PORT ? Number(process.env.RDS_PORT) : 5432,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
