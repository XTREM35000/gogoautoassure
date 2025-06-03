import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar } from '@/components/ui/avatar';
import { Settings, LogOut, User, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function UserAvatarMenu() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);

  if (!user || !user.first_name || !user.last_name) return null;

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleHardReset = async () => {
    try {
      setIsResetting(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Aucune session active');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-db`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la réinitialisation');
      }

      toast.success('Base de données réinitialisée avec succès');

      // Déconnexion et redirection vers la page d'accueil
      await logout();
      navigate('/');
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast.error(error.message || "Erreur lors de la réinitialisation");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar>
          {user.avatar_url ? (
            <Avatar.Image
              src={user.avatar_url}
              alt={user.display_name || ''}
              onError={(e) => {
                console.error('Erreur de chargement de l\'avatar:', e);
                e.currentTarget.src = '';
              }}
            />
          ) : (
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.display_name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </Link>
        </DropdownMenuItem>

        {user.role === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-red-600 focus:text-red-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Réinitialiser la BD</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Réinitialisation complète</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action va supprimer TOUTES les données (clients, contrats, véhicules) y compris les comptes administrateurs.
                    Vous devrez créer un nouveau compte admin après cette opération.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isResetting}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleHardReset}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isResetting}
                  >
                    {isResetting ? 'En cours...' : 'Confirmer'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
