-- Désactiver temporairement les contraintes de clé étrangère
SET session_replication_role = 'replica';

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

-- Réactiver les contraintes de clé étrangère
SET session_replication_role = 'origin';

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
