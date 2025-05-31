import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: string;
        };
      };
      // Ajoutez d'autres tables si nécessaire
    };
  };
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier la méthode
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Récupérer le token JWT de l'en-tête
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Créer un client Supabase
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    // Définir le JWT pour le client
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: '',
    });

    // Vérifier si l'utilisateur est admin
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Error fetching user');
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Error fetching profile');
    }

    if (profile.role !== 'admin') {
      throw new Error('Unauthorized - Admin role required');
    }

    // Journaliser l'action
    await supabaseClient.from('admin_actions').insert({
      user_id: user.id,
      action: 'reset_database',
      details: 'Database reset initiated',
      timestamp: new Date().toISOString(),
    });

    // Réinitialiser la base de données
    // Note: Vous devez créer cette fonction SQL dans votre base de données
    const { error: resetError } = await supabaseClient.rpc('reset_database');

    if (resetError) {
      throw resetError;
    }

    return new Response(
      JSON.stringify({ message: 'Database reset successful' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message === 'Unauthorized - Admin role required' ? 403 : 500,
      }
    );
  }
});
