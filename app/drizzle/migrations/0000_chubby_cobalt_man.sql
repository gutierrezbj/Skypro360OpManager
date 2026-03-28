CREATE TYPE "public"."user_role" AS ENUM('admin', 'org_admin', 'pilot', 'coordinator', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."drone_status" AS ENUM('active', 'maintenance', 'retired', 'pending_registration');--> statement-breakpoint
CREATE TYPE "public"."pilot_cert_status" AS ENUM('valid', 'expired', 'suspended', 'pending');--> statement-breakpoint
CREATE TYPE "public"."mission_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."mission_status" AS ENUM('draft', 'planned', 'approved', 'preflight', 'in_flight', 'completed', 'aborted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."incident_type" AS ENUM('flyaway', 'collision', 'injury', 'property_damage', 'airspace_violation', 'equipment_failure', 'communication_loss', 'battery_emergency', 'weather_event', 'other');--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"avatar_url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "drones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"model" varchar(255) NOT NULL,
	"manufacturer" varchar(255) NOT NULL,
	"registration_number" varchar(100),
	"status" "drone_status" DEFAULT 'pending_registration' NOT NULL,
	"max_flight_time_min" integer,
	"max_payload_kg" numeric(6, 2),
	"category" varchar(50),
	"easa_class" varchar(10),
	"mtom_kg" numeric(6, 2),
	"insurance_expiry" timestamp with time zone,
	"specs" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"license_number" varchar(100),
	"certification_status" "pilot_cert_status" DEFAULT 'pending' NOT NULL,
	"certification_expiry" timestamp with time zone,
	"medical_expiry" timestamp with time zone,
	"flight_hours" numeric(8, 1) DEFAULT '0',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "mission_status" DEFAULT 'draft' NOT NULL,
	"priority" "mission_priority" DEFAULT 'normal' NOT NULL,
	"pilot_id" uuid,
	"drone_id" uuid,
	"coordinator_id" uuid,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"actual_start" timestamp with time zone,
	"actual_end" timestamp with time zone,
	"sora_class" varchar(20),
	"earo_reference" varchar(100),
	"max_altitude_m" numeric(6, 1),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"changes" jsonb,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"items" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"incident_type" "incident_type" NOT NULL,
	"description" text NOT NULL,
	"actions_taken" text,
	"aesa_notified" boolean DEFAULT false,
	"json_data" jsonb,
	"signature_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_planning" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"risk_level" varchar(50),
	"weather_forecast" text,
	"operation_type" varchar(50),
	"max_altitude" varchar(50),
	"json_data" jsonb,
	"signature_data" text,
	"rp_approved" boolean DEFAULT false,
	"rp_signature" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_postflight" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"uas_id" varchar(100),
	"battery_remaining" varchar(10),
	"json_data" jsonb,
	"signature_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_preflight" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"uas_id" varchar(100),
	"weather_conditions" jsonb,
	"airspace_status" varchar(100),
	"json_data" jsonb,
	"signature_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flight_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mission_id" uuid,
	"pilot_id" uuid NOT NULL,
	"uas_id" uuid NOT NULL,
	"takeoff_time" timestamp with time zone,
	"landing_time" timestamp with time zone,
	"duration_minutes" integer,
	"max_altitude_m" numeric(6, 1),
	"observations" text,
	"signature_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operational_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"zone_type" varchar(50) DEFAULT 'operational' NOT NULL,
	"boundary_geojson" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restricted_zones_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"source" varchar(100) DEFAULT 'AESA' NOT NULL,
	"zone_type" varchar(50) NOT NULL,
	"boundary_geojson" text,
	"altitude_min_m" numeric(8, 1),
	"altitude_max_m" numeric(8, 1),
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drones" ADD CONSTRAINT "drones_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_pilot_id_pilots_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_drone_id_drones_id_fk" FOREIGN KEY ("drone_id") REFERENCES "public"."drones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_templates" ADD CONSTRAINT "compliance_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_incidents" ADD CONSTRAINT "form_incidents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_incidents" ADD CONSTRAINT "form_incidents_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_incidents" ADD CONSTRAINT "form_incidents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_planning" ADD CONSTRAINT "form_planning_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_planning" ADD CONSTRAINT "form_planning_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_planning" ADD CONSTRAINT "form_planning_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_postflight" ADD CONSTRAINT "form_postflight_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_postflight" ADD CONSTRAINT "form_postflight_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_postflight" ADD CONSTRAINT "form_postflight_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_preflight" ADD CONSTRAINT "form_preflight_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_preflight" ADD CONSTRAINT "form_preflight_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_preflight" ADD CONSTRAINT "form_preflight_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_logs" ADD CONSTRAINT "flight_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_logs" ADD CONSTRAINT "flight_logs_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_logs" ADD CONSTRAINT "flight_logs_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_logs" ADD CONSTRAINT "flight_logs_uas_id_drones_id_fk" FOREIGN KEY ("uas_id") REFERENCES "public"."drones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_zones" ADD CONSTRAINT "operational_zones_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_tenant_entity" ON "audit_logs" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_tenant_created" ON "audit_logs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_form_planning_mission" ON "form_planning" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "idx_flight_logs_tenant_mission" ON "flight_logs" USING btree ("tenant_id","mission_id");--> statement-breakpoint
CREATE INDEX "idx_flight_logs_pilot" ON "flight_logs" USING btree ("pilot_id");--> statement-breakpoint
CREATE INDEX "idx_op_zones_tenant" ON "operational_zones" USING btree ("tenant_id");