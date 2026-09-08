// Placeholder for future backend configuration

module.exports = {
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mayura_regalia',
  },

  // API configuration
  api: {
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
