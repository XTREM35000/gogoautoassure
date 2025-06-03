-- Supprimer la vue si elle existe déjà
DROP VIEW IF EXISTS agents_view;

-- Créer la vue des agents
CREATE OR REPLACE VIEW agents_view AS
SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.display_name,
    p.phone,
    p.status,
    p.role,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.permissions
FROM profiles p
WHERE p.role = 'agent'
OR p.role = 'admin';

-- Ajouter les politiques de sécurité pour la vue
ALTER VIEW agents_view OWNER TO authenticated;
GRANT SELECT ON agents_view TO authenticated;
