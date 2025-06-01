import { create } from 'zustand';
import { supabase, type UserProfile, type UserStatus } from '../lib/supabase';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  initialized: boolean;
}

const validateUserProfile = (profile: any): profile is UserProfile => {
  return (
    profile &&
    typeof profile.id === 'string' &&
    typeof profile.email === 'string' &&
    typeof profile.first_name === 'string' &&
    typeof profile.last_name === 'string' &&
    typeof profile.phone === 'string' &&
    typeof profile.status === 'string' &&
    ['pending', 'active', 'suspended', 'blocked'].includes(profile.status) &&
    typeof profile.display_name === 'string'
  );
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  initialized: false,

  fetchUser: async () => {
    console.log('Fetching user...');
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        console.log('No auth user found');
        set({ user: null, error: null });
        return;
      }

      // Utiliser la vue sécurisée au lieu de la table profiles
      const { data: profile, error: profileError } = await supabase
        .from('secure_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        // Ne pas bloquer la connexion si le profil n'est pas trouvé
        const defaultProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          first_name: authUser.user_metadata?.first_name || '',
          last_name: authUser.user_metadata?.last_name || '',
          phone: authUser.user_metadata?.phone || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: '',
          role: 'user',
          status: 'active',
          display_name: authUser.user_metadata?.display_name || '',
          permissions: ['manage_clients']
        };
        set({ user: defaultProfile, error: null });
        return;
      }

      set({ user: profile, error: null });
    } catch (error) {
      console.error('Error in fetchUser:', error);
      set({ user: null, error: 'Failed to fetch user' });
    }
  },

  logout: async () => {
    try {
      console.log('Logging out...');
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isLoading: false, error: null, initialized: true });
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la déconnexion',
        initialized: true
      });
    }
  }
}));

// Initial fetch
console.log('Performing initial fetch...');
useAuthStore.getState().fetchUser();

// Setup auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.id);

  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    useAuthStore.setState({ user: null, isLoading: false, error: null, initialized: true });
  } else if (session?.user) {
    console.log('Session found, fetching user...');
    useAuthStore.getState().fetchUser();
  } else {
    console.log('No session found');
    useAuthStore.setState({ user: null, isLoading: false, error: null, initialized: true });
  }
});
