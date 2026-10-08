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

  // Extra columns on products for inventory management
  await ensureColumn(pool, 'products', 'sku', "VARCHAR(60) DEFAULT NULL");
  await ensureColumn(pool, 'products', 'stock_quantity', "INT NOT NULL DEFAULT 0");
  await ensureColumn(pool, 'products', 'low_stock_threshold', "INT NOT NULL DEFAULT 5");
  await ensureColumn(pool, 'products', 'category_id', "INT DEFAULT NULL");
  // Multiple available colours for a product (JSON array), e.g. ["Gold","Silver"]
  await ensureColumn(pool, 'products', 'colors', "JSON DEFAULT NULL");
  // Images can be uploaded from the admin panel as base64 data URLs, which need
  // far more room than a VARCHAR(500) path, so widen the column to LONGTEXT.
  await pool.query(`ALTER TABLE products MODIFY COLUMN image LONGTEXT`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(160) NOT NULL UNIQUE,
      description TEXT,
      image VARCHAR(500) DEFAULT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS collections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(160) NOT NULL UNIQUE,
      description TEXT,
      image VARCHAR(500) DEFAULT NULL,
      product_ids JSON DEFAULT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      subtitle VARCHAR(255) DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      link VARCHAR(300) DEFAULT NULL,
      position VARCHAR(60) NOT NULL DEFAULT 'home_hero',
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(60) NOT NULL UNIQUE,
      type ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
      value DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      max_discount DECIMAL(10,2) DEFAULT NULL,
      usage_limit INT DEFAULT NULL,
      used_count INT NOT NULL DEFAULT 0,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      expires_at DATE DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gifts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      image VARCHAR(500) DEFAULT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT DEFAULT NULL,
      product_name VARCHAR(255) DEFAULT NULL,
      customer_name VARCHAR(150) NOT NULL,
      email VARCHAR(255) DEFAULT NULL,
      rating DECIMAL(2,1) NOT NULL DEFAULT 5,
      comment TEXT,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(30) DEFAULT NULL,
      address VARCHAR(400) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      pincode VARCHAR(20) DEFAULT NULL,
      total_orders INT NOT NULL DEFAULT 0,
      total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
      status ENUM('active','blocked') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Customer portal login: lets a customer set a password against their own
  // record so they can sign in with phone + password. Nullable so existing
  // customers created via guest checkout / admin panel are unaffected until
  // they sign up.
  await ensureColumn(pool, 'customers', 'password_hash', "VARCHAR(255) DEFAULT NULL");

  // Forgot-password (OTP) support: stores a hashed one-time code, its expiry,
  // wrong-attempt counter and last-sent time (for resend cooldown).
  await ensureColumn(pool, 'customers', 'reset_otp_hash', "VARCHAR(128) DEFAULT NULL");
  await ensureColumn(pool, 'customers', 'reset_otp_expires', "DATETIME DEFAULT NULL");
  await ensureColumn(pool, 'customers', 'reset_otp_attempts', "INT NOT NULL DEFAULT 0");
  await ensureColumn(pool, 'customers', 'reset_otp_sent_at', "DATETIME DEFAULT NULL");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(40) NOT NULL UNIQUE,
      customer_id INT DEFAULT NULL,
      customer_name VARCHAR(150) NOT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      address VARCHAR(400) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      pincode VARCHAR(20) DEFAULT NULL,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      discount DECIMAL(12,2) NOT NULL DEFAULT 0,
      shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      coupon_code VARCHAR(60) DEFAULT NULL,
      payment_method VARCHAR(40) NOT NULL DEFAULT 'COD',
      payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
      order_status ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT DEFAULT NULL,
      product_name VARCHAR(255) NOT NULL,
      image VARCHAR(500) DEFAULT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      quantity INT NOT NULL DEFAULT 1,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      order_number VARCHAR(40) NOT NULL,
      customer_name VARCHAR(150) DEFAULT NULL,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      method VARCHAR(40) NOT NULL DEFAULT 'COD',
      status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
      transaction_id VARCHAR(120) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Razorpay order id is created *before* the payment succeeds, so we need
  // somewhere to stash it in order to match up the webhook/verify call that
  // comes back later. Added via ensureColumn so existing installs migrate
  // cleanly without dropping their payments table.
  await ensureColumn(pool, 'payments', 'gateway_order_id', "VARCHAR(120) DEFAULT NULL");

  // Direct-UPI proof screenshot the customer uploads after paying, stored as
  // a base64 data URL (same approach already used for product/category/banner
  // images in this app), so the admin has visual evidence to check against
  // their bank/UPI app before approving or rejecting the payment.
  await ensureColumn(pool, 'payments', 'proof_image', "LONGTEXT DEFAULT NULL");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(80) PRIMARY KEY,
      setting_value TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  return pool;
}

async function ensureColumn(pool, table, column, definition) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (Number(rows[0].count) === 0) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
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