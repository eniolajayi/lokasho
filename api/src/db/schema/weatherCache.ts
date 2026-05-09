import { pgTable, text, jsonb, timestamp, real } from "drizzle-orm/pg-core";

export const weatherCache = pgTable("weather_cache", {
  id: text("id").primaryKey(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  data: jsonb("data").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
