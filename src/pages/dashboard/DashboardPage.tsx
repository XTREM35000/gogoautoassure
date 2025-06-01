import { useEffect, useState } from 'react';
import {
  Car,
  CircleDollarSign,
  FileText,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// Mock data
const mockContracts = [
  {
    id: '1',
    vehicle: 'Toyota Corolla',
    policy_number: 'G3A-123456-7890',
    premium_amount: 150000,
    start_date: '2023-06-01T00:00:00Z',
    end_date: '2024-05-31T23:59:59Z',
    status: 'active'
  },
  {
    id: '2',
    vehicle: 'Honda Civic',
    policy_number: 'G3A-234567-8901',
    premium_amount: 180000,
    start_date: '2023-01-15T00:00:00Z',
    end_date: '2024-01-14T23:59:59Z',
    status: 'active'
  }
];

const mockClaims = [
  {
    id: '1',
    date: '2023-08-12T10:30:00Z',
    type: 'Accident',
    status: 'pending',
    description: 'Collision à un carrefour'
  }
];

const mockPayments = [
  {
    id: '1',
    date: '2023-06-01T10:15:00Z',
    amount: 150000,
    method: 'orange_money',
    status: 'completed'
  }
];

interface DashboardStats {
  totalClients: number;
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalContracts: 0,
    activeContracts: 0,
    pendingContracts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('count');

      if (clientsError) throw clientsError;

      // Fetch contracts stats
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('status');

      if (contractsError) throw contractsError;

      const totalContracts = contractsData?.length || 0;
      const activeContracts = contractsData?.filter(c => c.status === 'active').length || 0;
      const pendingContracts = contractsData?.filter(c => c.status === 'pending').length || 0;

      setStats({
        totalClients: clientsData?.[0]?.count || 0,
        totalContracts,
        activeContracts,
        pendingContracts
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-gray-500">
            Bienvenue, {`${user.first_name} ${user.last_name}`}. Voici un aperçu de vos assurances.
          </p>
        </div>
        <Button className="shrink-0">
          <FileText className="w-4 h-4 mr-2" />
          Nouveau contrat
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Contrats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContracts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Contrats Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContracts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Contrats en Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingContracts}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Contrats</TabsTrigger>
          <TabsTrigger value="claims">Sinistres</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockContracts.map((contract) => (
              <Card key={contract.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {contract.vehicle}
                    </CardTitle>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                      Actif
                    </span>
                  </div>
                  <CardDescription>
                    Police: {contract.policy_number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Prime annuelle</p>
                      <p className="text-sm font-medium">{formatCurrency(contract.premium_amount)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Validité</p>
                      <p className="text-sm font-medium">
                        {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                    <Button variant="secondary" size="sm">
                      Renouveler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <Link to="/contracts" className="flex items-center text-sm text-orange-500 hover:text-orange-600">
              Voir tous les contrats
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          {mockClaims.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {mockClaims.map((claim) => (
                <Card key={claim.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{claim.type}</CardTitle>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        En cours
                      </span>
                    </div>
                    <CardDescription>
                      Déclaré le: {formatDate(claim.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{claim.description}</p>
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" size="sm">
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertTriangle className="w-10 h-10 mb-4 text-orange-500" />
                <p className="mb-2 text-lg font-medium">Aucun sinistre déclaré</p>
                <p className="mb-4 text-sm text-gray-500 text-center">
                  Vous n'avez pas encore déclaré de sinistre. En cas d'incident, déclarez-le rapidement.
                </p>
                <Button>
                  Déclarer un sinistre
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>
                Vos derniers paiements de primes d'assurance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-teal-500">
                        <CircleDollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Paiement de prime
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(payment.date)} via {payment.method === 'orange_money' ? 'Orange Money' : payment.method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <ArrowUpRight className="w-4 h-4 text-teal-500" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
