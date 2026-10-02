-- Agregar campos de perfil personalizados a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS "fotoPerfil" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "descripcion" VARCHAR(500);

-- Información Profesional
ALTER TABLE users ADD COLUMN IF NOT EXISTS "anosExperiencia" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "totalViajes" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "calificacionPromedio" DECIMAL(2,1) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "certificaciones" TEXT[];

-- Información Personal
ALTER TABLE users ADD COLUMN IF NOT EXISTS "edad" INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "idiomas" TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS "pasatiempos" TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS "frasePersonal" VARCHAR(200);

-- Preferencias de Servicio
ALTER TABLE users ADD COLUMN IF NOT EXISTS "musicaPreferida" VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "aceptaMascotas" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "tieneCascoExtra" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "estiloConduccion" VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "ofreceChucherias" BOOLEAN DEFAULT false;

-- Disponibilidad
ALTER TABLE users ADD COLUMN IF NOT EXISTS "horariosTrabajo" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "zonasPreferencia" TEXT[];

-- Información del Vehículo
ALTER TABLE users ADD COLUMN IF NOT EXISTS "accesoriosVehiculo" TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS "fotosVehiculo" TEXT[];

-- Social
ALTER TABLE users ADD COLUMN IF NOT EXISTS "redesSociales" JSON;

-- Seguridad y Confianza
ALTER TABLE users ADD COLUMN IF NOT EXISTS "documentosVerificados" JSON;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "fechaUltimaVerificacion" DATE;

-- Badges
ALTER TABLE users ADD COLUMN IF NOT EXISTS "badges" TEXT[];