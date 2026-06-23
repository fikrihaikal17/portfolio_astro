import mysql from "mysql2/promise";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

let pool: Pool | null = null;

const requiredEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const getPool = (): Pool => {
  if (pool) {
    return pool;
  }

  const host = requiredEnv("DB_HOST");
  const user = requiredEnv("DB_USER");
  const password = (import.meta.env.DB_PASSWORD as string | undefined) ?? "";
  const database = requiredEnv("DB_NAME");

  const port = Number(import.meta.env.DB_PORT ?? "3306");
  const connectionLimit = Number(import.meta.env.DB_CONNECTION_LIMIT ?? "10");

  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
    timezone: "Z",
  });

  pool.on("connection", (connection) => {
    (connection as any).query("SET time_zone = '+00:00'", (err: any) => {
      if (err) {
        console.error("Failed to set pool connection time_zone to UTC:", err);
      }
    });
  });

  return pool;
};

export const queryRows = async <T extends RowDataPacket[]>(
  sql: string,
  params: unknown[] = []
): Promise<T> => {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
};

export const executeQuery = async (
  sql: string,
  params: unknown[] = []
): Promise<ResultSetHeader> => {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params as any[]);
  return result;
};
