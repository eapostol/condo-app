import mysql from 'mysql2/promise';

const {
  MYSQL_HOST = 'localhost',
  MYSQL_PORT = '3306',
  MYSQL_DATABASE = 'condo_mgmt',
  MYSQL_USER = 'root',
  MYSQL_PASSWORD = ''
} = process.env;

export const mysqlPool = mysql.createPool({
  host: MYSQL_HOST,
  port: Number(MYSQL_PORT),
  database: MYSQL_DATABASE,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function mysqlPing() {
  const [rows] = await mysqlPool.query('SELECT 1 AS ok');
  return rows?.[0]?.ok === 1;
}
