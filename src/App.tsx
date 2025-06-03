import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { RootLayout } from '@/layouts/RootLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ContractsPage } from '@/pages/contracts/ContractsPage';
import { ClientsPage } from '@/pages/clients/ClientsPage';
import { AgentsPage } from '@/pages/agents/AgentsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { StatusRoute, PublicRoute } from '@/components/auth/StatusRoute';

// Configuration des drapeaux futurs de React Router
const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <PublicRoute><LoginPage /></PublicRoute>
    },
    {
      path: '/register',
      element: <PublicRoute><RegisterPage /></PublicRoute>
    },
    {
      path: '/verify-email',
      element: <PublicRoute><VerifyEmailPage /></PublicRoute>
    },
    {
      path: '/account-restricted',
      element: <PublicRoute><div>Votre compte est restreint. Contactez l'administrateur.</div></PublicRoute>
    },
    {
      path: '/',
      element: <RootLayout />,
      children: [
        {
          index: true,
          element: <StatusRoute><DashboardPage /></StatusRoute>
        },
        {
          path: 'contracts',
          element: <StatusRoute><ContractsPage /></StatusRoute>
        },
        {
          path: 'clients',
          element: <StatusRoute><ClientsPage /></StatusRoute>
        },
        {
          path: 'agents',
          element: <StatusRoute><AgentsPage /></StatusRoute>
        },
        {
          path: 'settings',
          element: <StatusRoute><SettingsPage /></StatusRoute>
        },
        {
          path: 'profile',
          element: <StatusRoute><ProfilePage /></StatusRoute>
        }
      ]
    }
  ],
  {
    future: {}
  }
);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
