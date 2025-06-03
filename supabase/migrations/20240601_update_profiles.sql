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

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Politique de lecture des profils" ON profiles;
DROP POLICY IF EXISTS "Politique de mise à jour des profils" ON profiles;
DROP POLICY IF EXISTS "Politique d'insertion des profils" ON profiles;
DROP POLICY IF EXISTS "Politique de suppression des profils" ON profiles;
DROP POLICY IF EXISTS "enable_read_access_for_all_users" ON profiles;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON profiles;
DROP POLICY IF EXISTS "enable_update_for_own_profile" ON profiles;
DROP POLICY IF EXISTS "enable_delete_for_admins" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Nouvelles politiques de sécurité simplifiées
CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Enable update for users based on id"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- Gérer les colonnes et contraintes
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS display_name TEXT GENERATED ALWAYS AS (TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) STORED,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ajouter la contrainte de status
ALTER TABLE public.profiles
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'suspended', 'blocked'));

-- Créer ou remplacer la fonction de mise à jour de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Créer le nouveau trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Réactiver les contraintes de clé étrangère
SET session_replication_role = 'origin';
