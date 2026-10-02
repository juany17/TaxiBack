-- Seed: Crear el primer usuario administrador
-- Ejecutar este script una vez en la base de datos mototaxi_db
-- Luego del registro manual o después de crear el usuario con rol pasajero

-- OPCIÓN 1: Crear el primer admin directamente (desactiva la validación de rol en el registro si es necesario)
-- Requiere que el usuario NO exista previamente
INSERT INTO users (id, nombre, email, telefono, password, rol, "createdAt")
VALUES (
  gen_random_uuid(),
  'Administrador del Sistema',
  'admin@mototaxi.com',
  '+573000000000',
  '$2b$10$rO8j.8XQZ.8XQZ.8XQZ.8XQZ.8XQZ.8XQZ.8XQZ.8XQZ.8XQZ.8XQZ.8X', -- Reemplazar con hash real
  'admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET rol = 'admin';

-- OPCIÓN 2: Actualizar un usuario existente a admin (si el email ya existe)
-- UPDATE users SET rol = 'admin' WHERE email = 'admin@mototaxi.com';

-- Verificar que el admin se creó correctamente
SELECT id, nombre, email, rol FROM users WHERE email = 'admin@mototaxi.com';