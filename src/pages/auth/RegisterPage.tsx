import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Shield, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuthStore } from '@/store/authStore';
import { supabase, validatePhoneNumber, formatPhoneNumber } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
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
      console.log('1. Début du processus d\'inscription');

      // Créer l'utilisateur avec seulement email et mot de passe
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formattedPhone,
            display_name: display_name.trim()
          }
        }
      });

      if (signUpError) {
        console.error('2. Erreur lors de la création du compte auth:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        console.error('2. Pas de données utilisateur retournées');
        throw new Error('Erreur lors de la création du compte');
      }

      console.log('2. Utilisateur auth créé avec succès:', authData.user.id);

      // Attendre un peu pour laisser le temps à auth de se propager
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Vérifier si c'est le premier utilisateur
      console.log('3. Vérification si premier utilisateur');
      let isFirstUser = false;

      // Utiliser une requête directe pour vérifier s'il y a des profils actifs
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('role', 'admin');

      if (countError) {
        console.error('3. Erreur lors du comptage des profils:', countError);
        // Par défaut, considérer comme non premier utilisateur en cas d'erreur
        isFirstUser = false;
      } else {
        isFirstUser = count === 0;
        console.log('Nombre d\'administrateurs actifs:', count);
      }

      console.log('3. Premier utilisateur:', isFirstUser);

      // Créer le profil
      const now = new Date().toISOString();
      const profileData = {
        id: authData.user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formattedPhone,
        created_at: now,
        updated_at: now,
        avatar_url: null,
        role: isFirstUser ? 'admin' : 'user',
        status: isFirstUser ? 'active' : 'pending',
        permissions: isFirstUser ? ['manage_system', 'manage_clients', 'manage_contracts'] : ['view_contracts']
      };

      console.log('4. Tentative de création du profil:', profileData);

      // Utiliser upsert au lieu de insert pour éviter les conflits
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert([profileData], {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('4. Erreur lors de la création du profil:', insertError);
        throw new Error('Erreur lors de la création du profil : ' + insertError.message);
      }

      console.log('4. Profil créé avec succès');

      // Upload de l'avatar si présent
      if (avatar) {
        console.log('5. Début upload avatar', { avatar });
        try {
          const fileExt = avatar.name.split('.').pop()?.toLowerCase() || 'jpg';
          const filePath = `${authData.user.id}/${authData.user.id}.${fileExt}`;
          console.log('5.1 Chemin du fichier:', filePath);

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatar, { upsert: true });

          if (uploadError) {
            console.error('5.2 Erreur upload avatar:', uploadError);
            toast.error('Erreur lors de l\'upload de l\'avatar');
          } else {
            console.log('5.3 Avatar uploadé avec succès');
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);

            console.log('5.4 URL publique:', urlData);

            if (urlData) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  avatar_url: urlData.publicUrl,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', authData.user.id);

              if (updateError) {
                console.error('5.5 Erreur mise à jour URL avatar:', updateError);
              } else {
                console.log('5.6 URL avatar mis à jour avec succès:', urlData.publicUrl);
              }
            }
          }
        } catch (error) {
          console.error('5.7 Erreur lors du traitement de l\'avatar:', error);
        }
      } else {
        console.log('5.0 Pas d\'avatar sélectionné');
      }

      // Si c'est le premier utilisateur, on le connecte directement
      if (isFirstUser) {
        console.log('6. Tentative de connexion du premier utilisateur');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error('6. Erreur connexion premier utilisateur:', signInError);
          toast.error('Compte créé mais erreur de connexion automatique');
          // Rediriger vers la page de connexion même en cas d'erreur
          navigate('/login', {
            state: {
              message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.'
            }
          });
        } else {
          console.log('6. Premier utilisateur connecté avec succès');
          navigate('/');
        }
      } else {
        // Pour les autres utilisateurs, rediriger vers la page de connexion
        console.log('6. Redirection vers la page de connexion');
        navigate('/login', {
          state: {
            message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.'
          }
        });
      }

    } catch (err: any) {
      console.error('Erreur globale:', err);
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
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
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
