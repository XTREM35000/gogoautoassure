-- Désactiver temporairement les contraintes de clé étrangère
SET session_replication_role = 'replica';

-- Créer le type de rôle d'abord
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'user');

-- Ajouter la colonne role à la table profiles
ALTER TABLE profiles
DROP COLUMN IF EXISTS role CASCADE;

ALTER TABLE profiles
ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- Créer une table pour les permissions
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT
);

-- Insérer les permissions de base
INSERT INTO permissions (name, description) VALUES
  ('manage_system', 'Gérer les paramètres système'),
  ('manage_agents', 'Gérer les agents'),
  ('manage_clients', 'Gérer les clients'),
  ('manage_contracts', 'Gérer les contrats'),
  ('view_contracts', 'Voir les contrats')
ON CONFLICT (name) DO NOTHING;

-- Créer une table de liaison pour les rôles et permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role user_role NOT NULL,
  permission_id INTEGER REFERENCES permissions(id),
  PRIMARY KEY (role, permission_id)
);

-- Insérer les permissions par défaut pour chaque rôle
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

INSERT INTO role_permissions (role, permission_id)
SELECT 'agent', id FROM permissions
WHERE name IN ('manage_clients', 'manage_contracts');

INSERT INTO role_permissions (role, permission_id)
SELECT 'user', id FROM permissions
WHERE name IN ('view_contracts');

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Politique de lecture des profils" ON profiles;
DROP POLICY IF EXISTS "Politique de mise à jour des profils" ON profiles;
DROP POLICY IF EXISTS "Politique d'insertion des profils" ON profiles;
DROP POLICY IF EXISTS "Politique de suppression des profils" ON profiles;

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Nouvelle politique de lecture simplifiée
CREATE POLICY "enable_read_access_for_all_users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Politique d'insertion simplifiée
CREATE POLICY "enable_insert_for_authenticated"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Politique de mise à jour simplifiée
CREATE POLICY "enable_update_for_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR role = 'admin');

-- Politique de suppression simplifiée
CREATE POLICY "enable_delete_for_admins"
ON profiles FOR DELETE
TO authenticated
USING (role = 'admin');

-- Fonction pour obtenir les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE (permission VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT p.name
  FROM profiles pr
  JOIN role_permissions rp ON pr.role = rp.role
  JOIN permissions p ON rp.permission_id = p.id
  WHERE pr.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réactiver les contraintes de clé étrangère
SET session_replication_role = 'origin';

-- 1. Supprimer les contraintes existantes sur status
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_status_check1,
DROP CONSTRAINT IF EXISTS valid_status;

-- 2. Gérer les colonnes existantes
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Mettre à jour display_name pour les profils existants
UPDATE public.profiles
SET display_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
WHERE display_name IS NULL;

-- 4. Nettoyer les espaces dans display_name
UPDATE public.profiles
SET display_name = TRIM(display_name)
WHERE display_name IS NOT NULL;

-- 5. S'assurer qu'aucun display_name n'est vide
UPDATE public.profiles
SET display_name = 'Utilisateur ' || id
WHERE display_name IS NULL OR TRIM(display_name) = '';

-- 6. Nettoyer et standardiser les status existants
UPDATE public.profiles
SET status = CASE
    WHEN status = 'active' THEN 'active'
    WHEN status = 'suspended' THEN 'suspended'
    WHEN status = 'blocked' THEN 'blocked'
    ELSE 'pending'
END;

-- 7. Convertir les rôles en statuts (si la colonne role existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'role'
    ) THEN
        UPDATE public.profiles
        SET status = 'active'
        WHERE role IN ('client', 'agent_junior', 'agent_senior', 'admin');

        -- Supprimer la colonne role
        ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
    END IF;
END $$;

-- 8. Maintenant que les données sont propres, ajouter les contraintes
ALTER TABLE public.profiles
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN status SET DEFAULT 'pending',
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'suspended', 'blocked')),
ALTER COLUMN display_name SET NOT NULL;

-- Mettre à jour la fonction de réinitialisation de la base de données
CREATE OR REPLACE FUNCTION reset_database()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_name text;
    backup_timestamp text;
BEGIN
    -- Créer un timestamp pour le backup
    backup_timestamp := to_char(now(), 'YYYY_MM_DD_HH24_MI_SS');

    -- Sauvegarder les données importantes avant la réinitialisation
    FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('migrations', 'admin_actions')
    LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS backup_%s_%s AS SELECT * FROM %I',
            table_name,
            backup_timestamp,
            table_name
        );
    END LOOP;

    -- Désactiver temporairement les contraintes de clé étrangère
    SET session_replication_role = 'replica';

    -- Nettoyer toutes les tables sauf les tables système
    FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('migrations', 'admin_actions')
    LOOP
        EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
    END LOOP;

    -- Réactiver les contraintes de clé étrangère
    SET session_replication_role = 'origin';

    -- Insérer les données par défaut
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        display_name,
        phone,
        status,
        created_at,
        updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        'admin@example.com',
        'Admin',
        'System',
        'Admin System',
        '+22500000000',
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Vous pouvez ajouter d'autres insertions de données par défaut ici
END;
$$;

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
