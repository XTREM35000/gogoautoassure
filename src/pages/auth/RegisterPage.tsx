import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuthStore } from '@/store/authStore';
import { supabase, UserRole, validatePhoneNumber, formatPhoneNumber } from '@/lib/supabase';
import { motion } from 'framer-motion';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client' as UserRole
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { error: authError } = useAuthStore();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      setFormError('Tous les champs sont obligatoires');
      return false;
    }

    if (formData.password.length < 6) {
      setFormError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (!validatePhoneNumber(formData.phone)) {
      setFormError('Format de numéro de téléphone invalide (+225 XX XX XX XX XX)');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Format d\'email invalide');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    console.log('Starting registration process...');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const formattedPhone = formatPhoneNumber(formData.phone);
    const display_name = `${formData.firstName} ${formData.lastName}`.trim();

    console.log('Formatted phone:', formattedPhone);

    try {
      // 1. Vérifier si l'email existe déjà
      console.log('Checking if email exists...');
      const { data: existingUsers, error: emailCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email);

      if (emailCheckError) {
        console.error('Email check error:', emailCheckError);
        throw new Error('Erreur lors de la vérification de l\'email');
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log('Email already exists');
        throw new Error('Cet email est déjà utilisé');
      }

      // 2. Vérifier si le téléphone existe déjà
      console.log('Checking if phone exists...');
      const { data: existingPhones, error: phoneCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', formattedPhone);

      if (phoneCheckError) {
        console.error('Phone check error:', phoneCheckError);
        throw new Error('Erreur lors de la vérification du numéro de téléphone');
      }

      if (existingPhones && existingPhones.length > 0) {
        console.log('Phone already exists');
        throw new Error('Ce numéro de téléphone est déjà utilisé');
      }

      // 3. Créer l'utilisateur avec toutes les données nécessaires
      console.log('Creating user...', {
        email: formData.email,
        phone: formattedPhone,
        display_name,
        role: 'client'
      });

      // Créer l'utilisateur avec le téléphone directement
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        phone: formattedPhone, // Ajouter le téléphone ici
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name,
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'client',
            phone: formattedPhone // Ajouter aussi dans les métadonnées
          }
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        if (signUpError.message.includes('registered')) {
          throw new Error('Cet email est déjà utilisé');
        }
        throw signUpError;
      }

      if (!authData.user) {
        console.error('No user data returned');
        throw new Error('Erreur lors de la création du compte');
      }

      console.log('User created:', authData.user.id);

      // 4. Créer le profil avec le téléphone
      const now = new Date().toISOString();
      const profileData = {
        id: authData.user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formattedPhone,
        role: 'client',
        created_at: now,
        updated_at: now,
        avatar_url: null,
        agency_id: null,
        permissions: [],
        status: 'pending',
        display_name
      };

      console.log('Creating profile...', profileData);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Supprimer l'utilisateur si la création du profil échoue
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
        if (deleteError) {
          console.error('Error deleting user after profile creation failed:', deleteError);
        }
        throw new Error('Erreur lors de la création du profil : ' + profileError.message);
      }

      console.log('Profile created');

      // Essayer de mettre à jour le téléphone via la fonction RPC
      try {
        const { error: phoneUpdateError } = await supabase.rpc('update_user_phone', {
          user_id: authData.user.id,
          phone_number: formattedPhone
        });

        if (phoneUpdateError) {
          console.error('Phone update error:', phoneUpdateError);
          // Ne pas bloquer l'inscription si la mise à jour du téléphone échoue
          console.warn('Failed to update phone number in auth.users');
        }
      } catch (error) {
        console.error('Error calling update_user_phone RPC:', error);
      }

      // Upload avatar si présent
      if (avatar) {
        try {
          console.log('Uploading avatar...', avatar);

          // Vérifier si le bucket existe
          const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

          if (bucketsError) {
            throw new Error('Erreur lors de la vérification des buckets: ' + bucketsError.message);
          }

          const avatarBucket = buckets.find(b => b.name === 'avatars');
          if (!avatarBucket) {
            throw new Error('Le bucket "avatars" n\'existe pas');
          }

          // Créer un nom de fichier unique
          const fileExt = avatar.name.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${authData.user.id}/${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          // Upload du fichier
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatar, {
              cacheControl: '3600',
              upsert: true,
              contentType: `image/${fileExt}`
            });

          if (uploadError) {
            console.error('Avatar upload error:', uploadError);
            throw new Error('Erreur lors de l\'upload de l\'avatar: ' + uploadError.message);
          }

          console.log('Avatar uploaded successfully', uploadData);

          // Obtenir l'URL publique
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          if (!urlData?.publicUrl) {
            throw new Error('Impossible d\'obtenir l\'URL publique de l\'avatar');
          }

          console.log('Avatar public URL:', urlData.publicUrl);

          // Mettre à jour le profil avec l'URL de l'avatar
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              avatar_url: urlData.publicUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.user.id);

          if (updateError) {
            console.error('Error updating avatar URL in profile:', updateError);
            throw new Error('Erreur lors de la mise à jour du profil avec l\'avatar');
          }

          console.log('Avatar URL updated in profile successfully');
        } catch (error) {
          console.error('Error in avatar upload process:', error);
          // Ne pas bloquer l'inscription si l'upload de l'avatar échoue
          console.warn('Avatar upload failed, continuing without avatar');
        }
      }

      // Connexion automatique après l'inscription
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError);
        // Rediriger vers la page de vérification d'email si la connexion automatique échoue
        navigate('/verify-email', {
          state: {
            email: formData.email,
            message: 'Vérifiez votre email pour activer votre compte'
          }
        });
      } else {
        // Rediriger vers le dashboard si la connexion automatique réussit
        console.log('Auto sign-in successful, redirecting to dashboard...');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message.includes('registered') || err.message.includes('already exists')) {
        setFormError('Cet email est déjà utilisé');
      } else if (err.message.includes('phone')) {
        setFormError('Format de téléphone invalide ou déjà utilisé');
      } else {
        setFormError(err.message || 'Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center w-full px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-2/5">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div className="flex items-center mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-gradient-primary">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900">
              Gogo AutoAssure
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Créer un compte
            </h2>
            <p className="mt-2 text-gray-600">
              Rejoignez G3A et gérez vos assurances auto en toute simplicité.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {(authError || formError) && (
              <div className="p-3 text-sm text-white rounded-md bg-red-500">
                {formError || authError}
              </div>
            )}

            <AvatarUpload
              onFileSelect={(file) => setAvatar(file)}
              className="mb-6"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <div className="mt-1">
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Jean"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <div className="mt-1">
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Dupont"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <div className="mt-1">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+225 XX XX XX XX XX"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Inscription en cours...' : 'S\'inscrire'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-gray-50">
                  Déjà inscrit ?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/login">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  Se connecter
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="relative hidden w-0 lg:block lg:w-1/2 xl:w-3/5">
        <div className="absolute inset-0 object-cover w-full h-full bg-gradient-primary">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex flex-col items-center max-w-lg text-center"
            >
              <Car className="w-24 h-24 mb-6" />
              <h2 className="mb-4 text-3xl font-bold">Votre assurance auto digitalisée</h2>
              <p className="mb-6 text-lg">
                Gérez vos contrats, payez vos primes et déclarez vos sinistres en quelques clics avec G3A.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="p-4 bg-white bg-opacity-10 rounded-lg">
                  <h3 className="mb-2 text-xl font-semibold">Paiement Facile</h3>
                  <p>Payez vos primes via Mobile Money (Orange, MTN, Moov, Wave)</p>
                </div>
                <div className="p-4 bg-white bg-opacity-10 rounded-lg">
                  <h3 className="mb-2 text-xl font-semibold">Suivi en Temps Réel</h3>
                  <p>Consultez l'état de vos contrats et sinistres à tout moment</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
