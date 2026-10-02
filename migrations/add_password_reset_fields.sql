-- Migración: Agregar campos para recuperación de contraseña por email
-- Fecha: Octubre 2026
-- Descripción: Agrega reset_token y reset_token_expiry a la tabla users

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "resetToken" VARCHAR,
  ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMPTZ;
