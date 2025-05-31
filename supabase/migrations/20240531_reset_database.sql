-- Créer la table pour les journaux d'actions administrateur si elle n'existe pas
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'completed'
);

-- Fonction pour réinitialiser la base de données
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

    -- Exemple : Créer un utilisateur admin par défaut si nécessaire
    INSERT INTO public.profiles (id, email, first_name, last_name, role, phone)
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        'admin@example.com',
        'Admin',
        'System',
        'admin',
        '+22500000000'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Vous pouvez ajouter d'autres insertions de données par défaut ici
END;
$$;
