import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/authStore';

export function RootLayout() {
  const { user } = useAuthStore();

  // Définir les permissions par défaut pour chaque type d'utilisateur
  const hasAgentPermissions = user?.permissions?.includes('manage_clients');
  const hasAdminPermissions = user?.permissions?.includes('manage_system');

  // Construire la navigation en fonction des permissions
  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/',
      icon: 'dashboard'
    },
    {
      name: 'Contrats',
      href: '/contracts',
      icon: 'contracts'
    }
  ];

  // Ajouter les routes d'agent si l'utilisateur a les permissions
  if (hasAgentPermissions) {
    navigation.push({
      name: 'Clients',
      href: '/clients',
      icon: 'clients'
    });
  }

  // Ajouter les routes d'admin si l'utilisateur a les permissions
  if (hasAdminPermissions) {
    navigation.push(
      {
        name: 'Agents',
        href: '/agents',
        icon: 'agents'
      },
      {
        name: 'Paramètres',
        href: '/settings',
        icon: 'settings'
      }
    );
  }

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar navigation={navigation} />
        <main className="flex-1 overflow-y-auto bg-background pl-20 md:pl-20 transition-all duration-300">
          <div className="container mx-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
