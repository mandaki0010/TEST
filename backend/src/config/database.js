const { Pool } = require('pg');

let poolConfig;

if (process.env.INSTANCE_CONNECTION_NAME) {
  // Cloud Run: Cloud SQL へ Unix ソケット経由で接続
  poolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
  };
} else {
  // ローカル開発: TCP 接続
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'employees',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
  };
}

const pool = new Pool(poolConfig);

module.exports = pool;
