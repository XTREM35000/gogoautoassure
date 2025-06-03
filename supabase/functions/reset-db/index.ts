import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type' // Added apikey here
};

serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérification auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Authorization header missing')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Vérification utilisateur admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Authentication failed')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Admin privileges required')
    }

    // Client admin (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    // Tables à réinitialiser (sans permissions/admin_actions)
    const tablesToReset = [
      'paiements',
      'sinistres',
      'vignettes',
      'contrats',
      'vehicules',
      'contracts',
      'clients',
      'profiles_backup',
      'profiles' // Toujours en dernier
    ]

    // 1. Désactiver les triggers
    await supabaseAdmin.rpc('disable_triggers')

    // 2. Suppression des données
    for (const table of tablesToReset) {
      if (table === 'profiles') {
        // Ne supprime que les non-admins
        await supabaseAdmin
          .from(table)
          .delete()
          .neq('id', user.id)
          .neq('role', 'admin')
      } else {
        // Suppression standard
        await supabaseAdmin
          .from(table)
          .delete()
          .neq('id', 0)
      }
      console.log(`Table ${table} nettoyée`)
    }

    // 3. Réactiver les triggers
    await supabaseAdmin.rpc('enable_triggers')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Réinitialisation réussie (tables protégées conservées)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
