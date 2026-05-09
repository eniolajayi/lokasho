import {
  pgTable,
  uuid,
  text,
  real,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

// a drying session table
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceToken: text("device_token").notNull(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  active: boolean("active").notNull().default(true),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});
