-- ====================================================================
-- SCRIPT DE CONFIGURACIÓN DE SUPABASE: BASE DE DATOS Y STORAGE BUCKET
-- Proyecto: Sistema de Gestión Empresarial Multiplataforma (DAM 0488)
-- ====================================================================

-- 1. CREACIÓN DE LA TABLA 'usuarios'
CREATE TABLE IF NOT EXISTS public.usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    rol VARCHAR(50) NOT NULL DEFAULT 'Usuario Estandar',
    departamento VARCHAR(80) NOT NULL DEFAULT 'Desarrollo',
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    avatar_url TEXT,
    fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 2. HABILITACIÓN DE POLÍTICAS DE ACCESO (Row Level Security - RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública para anon key
DROP POLICY IF EXISTS "Permitir lectura publica de usuarios" ON public.usuarios;
CREATE POLICY "Permitir lectura publica de usuarios"
ON public.usuarios FOR SELECT
TO anon, authenticated
USING (true);

-- Política de actualización de estado para anon key
DROP POLICY IF EXISTS "Permitir actualizacion de estado" ON public.usuarios;
CREATE POLICY "Permitir actualizacion de estado"
ON public.usuarios FOR UPDATE
TO anon, authenticated
USING (true);

-- Política de inserción de nuevos registros para anon key
DROP POLICY IF EXISTS "Permitir insercion de nuevos usuarios" ON public.usuarios;
CREATE POLICY "Permitir insercion de nuevos usuarios"
ON public.usuarios FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. CONFIGURACIÓN DEL BUCKET DE ALMACENAMIENTO (Storage Bucket 'avatars')
-- Crea el bucket público 'avatars' para alojar las fotografías de perfil
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de acceso para los archivos del bucket 'avatars'
DROP POLICY IF EXISTS "Acceso publico de lectura en avatars" ON storage.objects;
CREATE POLICY "Acceso publico de lectura en avatars"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Subida libre en avatars para la app" ON storage.objects;
CREATE POLICY "Subida libre en avatars para la app"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Modificacion libre en avatars" ON storage.objects;
CREATE POLICY "Modificacion libre en avatars"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'avatars');

-- 4. INSERCIÓN / ACTUALIZACIÓN DE REGISTROS DE PRUEBA
-- Todas las imágenes apuntan al bucket 'avatars' de Supabase (sin enlaces externos)
INSERT INTO public.usuarios (id, nombre, email, rol, departamento, estado, avatar_url, fecha_alta)
VALUES
    (1, 'Ana García', 'ana@empresa.com', 'Administrador', 'Desarrollo', 'Activo', 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_1.png', '2023-01-15'),
    (2, 'Luis Pérez', 'luis@empresa.com', 'Usuario Estandar', 'Soporte', 'Activo', 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_2.png', '2023-03-22'),
    (3, 'Carlos Ruiz', 'carlos@empresa.com', 'Usuario Estandar', 'Ventas', 'Activo', 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_3.png', '2023-05-10'),
    (4, 'Elena Moreno', 'elena@empresa.com', 'Administrador', 'Finanzas', 'Activo', 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_4.png', '2023-07-18'),
    (5, 'Javier Domínguez', 'javier@empresa.com', 'Usuario Estandar', 'Desarrollo', 'Inactivo', 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_5.png', '2023-09-01'),
    (6, 'Marta Soler', 'marta@empresa.com', 'Usuario Estandar', 'Marketing', 'Activo', 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_6.png', '2023-11-04'),
    (7, 'Sergio Morales', 'sergio@empresa.com', 'Usuario Estandar', 'Ventas', 'Activo', 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_7.png', '2024-01-12'),
    (8, 'Patricia Romero', 'patricia@empresa.com', 'Administrador', 'Soporte', 'Inactivo', 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_8.png', '2024-02-28')
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    rol = EXCLUDED.rol,
    departamento = EXCLUDED.departamento,
    estado = EXCLUDED.estado,
    avatar_url = EXCLUDED.avatar_url,
    fecha_alta = EXCLUDED.fecha_alta;

-- Ajustar la secuencia de IDs al valor máximo para que las nuevas inserciones no colisionen
SELECT setval('public.usuarios_id_seq', (SELECT MAX(id) FROM public.usuarios));
