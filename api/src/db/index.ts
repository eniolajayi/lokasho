import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL enviroment variable is required");
}
const queryClient = postgres(connectionString);
export const db = drizzle({ client: queryClient });
export type Db = typeof db;
