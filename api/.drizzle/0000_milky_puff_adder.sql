CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_token" text NOT NULL,
	"lat" real NOT NULL,
	"lon" real NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_token" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_device_token_unique" UNIQUE("device_token")
);
--> statement-breakpoint
CREATE TABLE "weather_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"lat" real NOT NULL,
	"lon" real NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
