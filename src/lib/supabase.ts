import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Loaded' : 'Not Loaded');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Enable debug mode in development
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  logger: {
    level: 'debug',
    native: true
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

export type UserStatus = 'pending' | 'active' | 'suspended' | 'blocked';
export type UserRole = 'admin' | 'agent' | 'user';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['manage_system', 'manage_agents', 'manage_clients', 'manage_contracts'],
  agent: ['manage_clients', 'manage_contracts'],
  user: ['view_contracts']
};

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: UserStatus;
  role: UserRole;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  agency_id?: string;
  permissions?: string[];
}

export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it already includes the country code
  if (digits.startsWith('225')) {
    return `+${digits}`;
  }

  // Add the country code if not present
  return `+225${digits}`;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+225[0-9]{10}$/;
  return phoneRegex.test(formatPhoneNumber(phone));
};

export const getFullName = (profile: UserProfile): string => {
  return `${profile.first_name} ${profile.last_name}`.trim();
};

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}
