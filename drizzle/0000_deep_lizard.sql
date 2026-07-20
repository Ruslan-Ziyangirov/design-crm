CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"phone" text,
	"email" text,
	"telegram" text,
	"website" text,
	"city" text,
	"source_id" text,
	"notes" text,
	"tags" text DEFAULT '[]' NOT NULL,
	"status" text DEFAULT 'lead' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"last_contact_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"title" text NOT NULL,
	"service_type_id" text,
	"description" text,
	"price" double precision DEFAULT 0 NOT NULL,
	"prepayment_received" double precision DEFAULT 0 NOT NULL,
	"payment_received" double precision DEFAULT 0 NOT NULL,
	"expenses" double precision DEFAULT 0 NOT NULL,
	"status_id" text NOT NULL,
	"payment_status_id" text NOT NULL,
	"source_id" text,
	"first_contact_date" timestamp with time zone,
	"start_date" timestamp with time zone,
	"deadline" timestamp with time zone,
	"completed_date" timestamp with time zone,
	"project_url" text,
	"materials_url" text,
	"notes" text,
	"tags" text DEFAULT '[]' NOT NULL,
	"review_received" boolean DEFAULT false NOT NULL,
	"review_text" text,
	"review_url" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#64748b' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#64748b' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"category" text DEFAULT 'active' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"order_id" text,
	"type" text NOT NULL,
	"note" text,
	"event_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT 'Владелец' NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"crm_name" text DEFAULT 'Моя CRM' NOT NULL,
	"currency" text DEFAULT 'RUB' NOT NULL,
	"timezone" text DEFAULT 'Europe/Moscow' NOT NULL,
	"date_format" text DEFAULT 'dd.MM.yyyy' NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_id_project_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."project_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_status_id_payment_statuses_id_fk" FOREIGN KEY ("payment_status_id") REFERENCES "public"."payment_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_statuses" ADD CONSTRAINT "payment_statuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_statuses" ADD CONSTRAINT "project_statuses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clients_user_idx" ON "clients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "clients_source_idx" ON "clients" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_client_idx" ON "orders" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status_id");--> statement-breakpoint
CREATE INDEX "orders_deadline_idx" ON "orders" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "orders_start_date_idx" ON "orders" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "orders_completed_date_idx" ON "orders" USING btree ("completed_date");--> statement-breakpoint
CREATE INDEX "timeline_client_idx" ON "timeline_events" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "timeline_date_idx" ON "timeline_events" USING btree ("event_date");