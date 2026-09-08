const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const caPath =
  process.env.DB_SSL_CA_PATH ||
  path.join(__dirname, '..', 'certs', 'Aiven.pem');

const sslConfig =
  process.env.DB_SSL === 'true'
    ? {
        ca: fs.readFileSync(caPath),
        rejectUnauthorized: true,
      }
    : undefined;

const baseConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ...(sslConfig ? { ssl: sslConfig } : {}),
};

let pool;

async function initializeDatabase() {
  const databaseName = process.env.DB_NAME || 'defaultdb';

  const connection = await mysql.createConnection({
    ...baseConfig,
    database: databaseName,
  });

  console.log('✅ Connected to Aiven MySQL with SSL');

  await connection.end();

  pool = mysql.createPool({
    ...baseConfig,
    database: databaseName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // your CREATE TABLE queries continue here...

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL DEFAULT 'Admin',
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin') NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2) DEFAULT NULL,
      discount DECIMAL(5,2) NOT NULL DEFAULT 0,
      rating DECIMAL(2,1) NOT NULL DEFAULT 0,
      material VARCHAR(150) DEFAULT NULL,
      color VARCHAR(100) DEFAULT NULL,
      in_stock TINYINT(1) NOT NULL DEFAULT 1,
      description TEXT,
      image VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database has not been initialized');
  }

  return pool;
}

module.exports = {
  initializeDatabase,
  getPool,
};