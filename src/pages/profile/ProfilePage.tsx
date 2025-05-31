import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Camera, Loader2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuthStore } from '@/store/authStore';
import { supabase, getFullName, uploadAvatar } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updates = {
        id: user!.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id);

      if (updateError) throw updateError;

      if (avatar) {
        const fileExt = avatar.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${user!.id}/${user!.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        if (urlData) {
          const { error: avatarError } = await supabase
            .from('profiles')
            .update({
              avatar_url: urlData.publicUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user!.id);

          if (avatarError) throw avatarError;
        }
      }

      await fetchUser();
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-white bg-red-500 rounded">
                    {error}
                  </div>
                )}

                <div className="flex justify-center">
                  <AvatarUpload
                    avatarUrl={user.avatar_url}
                    onFileSelect={(file) => setAvatar(file)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Prénom
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Nom
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input value={formData.email} disabled />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Permissions
                  </label>
                  <ul className="mt-1 space-y-1">
                    {user.permissions?.includes('manage_system') && (
                      <>
                        <li className="text-sm">✓ Gestion des utilisateurs</li>
                        <li className="text-sm">✓ Configuration du système</li>
                        <li className="text-sm">✓ Rapports avancés</li>
                      </>
                    )}
                    {user.permissions?.includes('manage_clients') && (
                      <>
                        <li className="text-sm">✓ Gestion des clients</li>
                        <li className="text-sm">✓ Gestion des contrats</li>
                      </>
                    )}
                    {user.permissions?.includes('consult_contracts') && (
                      <>
                        <li className="text-sm">✓ Consultation des contrats</li>
                      </>
                    )}
                    {user.permissions?.includes('declare_claims') && (
                      <>
                        <li className="text-sm">✓ Déclaration de sinistres</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex justify-end space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={isLoading}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      disabled={isLoading}
                    >
                      Modifier
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {user.permissions?.includes('manage_system') && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">
                Administration
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Accès aux fonctionnalités d'administration du système
              </p>
            </div>
          )}

          {user.permissions?.includes('manage_clients') && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">
                Gestion des clients
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Accès à la gestion des clients et des contrats
              </p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">
              Statut du compte
            </h3>
            <p className="mt-1 text-sm capitalize">{user.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
