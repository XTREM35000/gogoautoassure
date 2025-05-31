import { create } from 'zustand';
import { supabase, type UserProfile, type UserRole } from '../lib/supabase';

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
    typeof profile.role === 'string' &&
    ['client', 'agent_junior', 'agent_senior', 'admin'].includes(profile.role)
  );
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  initialized: false,

  fetchUser: async () => {
    try {
      // Si déjà en cours de chargement et initialisé, ne pas refaire la requête
      if (get().isLoading && get().initialized) {
        console.log('Fetch user skipped - already loading');
        return;
      }

      console.log('Fetching user...');
      set({ isLoading: true, error: null });

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      console.log('Auth user:', authUser?.id);

      if (!authUser) {
        console.log('No auth user found');
        set({ user: null, isLoading: false, error: null, initialized: true });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Impossible de charger le profil utilisateur');
      }

      if (!validateUserProfile(profile)) {
        console.error('Invalid profile:', profile);
        throw new Error('Profil utilisateur invalide ou incomplet');
      }

      console.log('Profile loaded:', profile.id, profile.role);
      set({ user: profile, isLoading: false, error: null, initialized: true });
    } catch (error) {
      console.error('Error in fetchUser:', error);
      set({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement du profil',
        initialized: true
      });
    }
  },

  logout: async () => {
    try {
      console.log('Logging out...');
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isLoading: false, error: null });
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la déconnexion'
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
    useAuthStore.setState({ user: null, isLoading: false, error: null });
  } else if (session?.user) {
    console.log('Session found, fetching user...');
    useAuthStore.getState().fetchUser();
  } else {
    console.log('No session found');
    useAuthStore.setState({ user: null, isLoading: false, error: null, initialized: true });
  }
});
