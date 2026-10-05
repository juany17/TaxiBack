ALTER TABLE "trips"
  ADD COLUMN IF NOT EXISTS "payment_method" VARCHAR NOT NULL DEFAULT 'efectivo',
  ADD COLUMN IF NOT EXISTS "cash_tendered" NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS "payment_issue" VARCHAR,
  ADD COLUMN IF NOT EXISTS "payment_reviewed_at" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "payment_reviewed_by" UUID,
  ADD COLUMN IF NOT EXISTS "payment_review_action" VARCHAR;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "mercadoPagoAlias" VARCHAR(100);
