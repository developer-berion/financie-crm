alter table "public"."leads" add column "contact_attempts" smallint default 0;
alter table "public"."leads" add column "last_contact_attempt" timestamp with time zone;
