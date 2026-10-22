// Shared by the Next.js server and database setup commands.
export function databaseConfigured(env = process.env) {
  return Boolean(env.DATABASE_URL || (env.DB_NAME && env.DB_USER && env.DB_PASSWORD));
}
export function databaseOptions(env = process.env) {
  let access;
  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL);
    if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql:// for Hostinger MySQL.');
    access = { host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)) };
  } else {
    if (!databaseConfigured(env)) throw new Error('Store database is not configured. Set DB_NAME, DB_USER and DB_PASSWORD.');
    access = { host: env.DB_HOST || '127.0.0.1', port: Number(env.DB_PORT || 3306), user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME };
  }
  if (!Number.isInteger(access.port) || access.port < 1 || access.port > 65535) throw new Error('Invalid database port.');
  if (!access.database || !access.user) throw new Error('Database name and user are required.');
  if (env.DB_SSL && !['true', 'false'].includes(env.DB_SSL)) throw new Error('DB_SSL must be true or false.');
  return { ...access, charset: 'utf8mb4', timezone: 'Z', decimalNumbers: true, supportBigNumbers: true, bigNumberStrings: true, connectionLimit: 5, waitForConnections: true, queueLimit: 100, connectTimeout: 10000, enableKeepAlive: true, ...(env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true, ...(env.DB_SSL_CA ? { ca: env.DB_SSL_CA.replace(/\\n/g, '\n') } : {}) } } : {}) };
}
