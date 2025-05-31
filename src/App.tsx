import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
import { RoleRoute, PublicRoute } from '@/components/auth/RoleRoute';

const router = createBrowserRouter([
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
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <RoleRoute allowedRoles={['client', 'agent_junior', 'agent_senior', 'admin']}><DashboardPage /></RoleRoute>
      },
      {
        path: 'contracts',
        element: <RoleRoute allowedRoles={['client', 'agent_junior', 'agent_senior', 'admin']}><ContractsPage /></RoleRoute>
      },
      {
        path: 'clients',
        element: <RoleRoute allowedRoles={['agent_junior', 'agent_senior', 'admin']}><ClientsPage /></RoleRoute>
      },
      {
        path: 'agents',
        element: <RoleRoute allowedRoles={['admin']}><AgentsPage /></RoleRoute>
      },
      {
        path: 'settings',
        element: <RoleRoute allowedRoles={['admin']}><SettingsPage /></RoleRoute>
      },
      {
        path: 'profile',
        element: <RoleRoute allowedRoles={['client', 'agent_junior', 'agent_senior', 'admin']}><ProfilePage /></RoleRoute>
      }
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
