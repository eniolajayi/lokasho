import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL enviroment variable is required");
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
export type Db = typeof db;
