import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { sessions } from "./sessions";

export const alertLogs = pgTable("alert_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["good_window", "score_drop", "rain_incoming", "sunset_soon"],
  }).notNull(),
  score: integer("score").notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});
