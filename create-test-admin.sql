-- Script SQL para crear cuenta de prueba con acceso de administrador
-- Email: test@bisonteapp.com
-- Password: TestBisonte2024!
-- Hash bcrypt generado para la contraseña: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZvnTZ.ri

-- IMPORTANTE: Ejecutar en la base de datos PostgreSQL de producción
-- DATABASE_URL: postgresql://neondb_owner:AIQ8WJXxBaAE@ep-quiet-shape-a5emzyvl.us-east-2.aws.neon.tech/neondb?sslmode=require

-- 1. Verificar si el usuario ya existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'test@bisonteapp.com') THEN
        -- 2. Insertar el usuario de prueba con acceso de administrador
        INSERT INTO usuarios (
            nombre,
            celular,
            ciudad,
            email,
            password,
            "esAdministrador",
            "esRecolector",
            "emailVerified",
            "perfilCompleto",
            "tipoDocumento",
            "numeroDocumento",
            "direccionRecogida",
            "createdAt",
            "updatedAt"
        ) VALUES (
            'Test Admin',
            '3001234567',
            'Bogotá',
            'test@bisonteapp.com',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZvnTZ.ri',
            true,  -- ✅ ES ADMINISTRADOR
            false,
            true,  -- Email verificado
            true,  -- Perfil completo
            'CC',
            '1234567890',
            'Calle 123 #45-67',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Usuario de prueba creado exitosamente: test@bisonteapp.com';
    ELSE
        -- Si el usuario existe, actualizar para que sea administrador
        UPDATE usuarios 
        SET 
            "esAdministrador" = true,
            "emailVerified" = true,
            "perfilCompleto" = true,
            password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZvnTZ.ri',
            "updatedAt" = NOW()
        WHERE email = 'test@bisonteapp.com';
        
        RAISE NOTICE 'Usuario de prueba actualizado a administrador: test@bisonteapp.com';
    END IF;
END $$;

-- 3. Verificar que el usuario fue creado correctamente
SELECT 
    id,
    nombre,
    email,
    "esAdministrador",
    "emailVerified",
    "perfilCompleto",
    "createdAt"
FROM usuarios 
WHERE email = 'test@bisonteapp.com';

-- CREDENCIALES DE PRUEBA PARA GOOGLE PLAY:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Email: test@bisonteapp.com
-- Password: TestBisonte2024!
-- Acceso: ADMINISTRADOR (puede acceder a /admin/envios)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
