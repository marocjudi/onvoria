CREATE TYPE "public"."invoice_template_type" AS ENUM('DEFAULT', 'MODERN', 'PROFESSIONAL', 'MINIMAL', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('SMS', 'EMAIL', 'WHATSAPP', 'APP');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('NEW_TICKET', 'STATUS_UPDATE', 'PAYMENT', 'INVOICE', 'INFO');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PAID', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'PAST_DUE', 'UNPAID', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('NONE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('RECEIVED', 'DIAGNOSED', 'IN_PROGRESS', 'COMPLETED', 'READY');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'SHOP_OWNER', 'TECHNICIAN', 'RECEPTIONIST', 'CUSTOMER');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"company" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"ticket_count" integer DEFAULT 0,
	"sms_notifications" boolean DEFAULT false,
	"whatsapp_notifications" boolean DEFAULT false,
	"email_notifications" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "company_branding" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_name" text NOT NULL,
	"company_logo" text,
	"primary_color" text DEFAULT '#3b82f6',
	"accent_color" text DEFAULT '#f59e0b',
	"font_family" text DEFAULT 'Inter, sans-serif',
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"phone" text,
	"email" text,
	"website" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" "invoice_template_type" DEFAULT 'DEFAULT' NOT NULL,
	"header_html" text,
	"footer_html" text,
	"items_table_html" text,
	"css" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"client_id" integer NOT NULL,
	"client_name" text NOT NULL,
	"ticket_id" integer NOT NULL,
	"items" json NOT NULL,
	"sub_total" integer NOT NULL,
	"tax" integer NOT NULL,
	"total" integer NOT NULL,
	"notes" text,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"date" timestamp DEFAULT now(),
	"due_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"resource_id" integer,
	"resource_type" text,
	"is_read" boolean DEFAULT false,
	"action_label" text,
	"action_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"client_id" integer NOT NULL,
	"client_name" text NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"reference" text,
	"status" "payment_status" DEFAULT 'PAID' NOT NULL,
	"date" timestamp DEFAULT now(),
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"username" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"client_name" text NOT NULL,
	"device_type" text NOT NULL,
	"device_model" text NOT NULL,
	"issue_type" text NOT NULL,
	"issue_description" text NOT NULL,
	"priority" text NOT NULL,
	"status" "ticket_status" DEFAULT 'RECEIVED' NOT NULL,
	"due_date" timestamp NOT NULL,
	"technician_id" integer,
	"marketing_rating" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"status_history" json DEFAULT '[]'::json,
	"attachments" json DEFAULT '[]'::json
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"role" "user_role" DEFAULT 'TECHNICIAN',
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_tier" "subscription_tier" DEFAULT 'NONE',
	"subscription_status" "subscription_status",
	"subscription_current_period_end" timestamp,
	"shop_id" integer,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
