import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enable debug mode in development
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions);

export type UserRole = 'client' | 'agent_junior' | 'agent_senior' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
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
