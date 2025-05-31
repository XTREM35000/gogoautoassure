import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  status: string;
  permissions: string[];
  clients_count: number;
  contracts_count: number;
  created_at: string;
}

const mockAgents: Agent[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    status: 'active',
    permissions: ['manage_clients', 'manage_contracts'],
    clients_count: 45,
    contracts_count: 78,
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    status: 'active',
    permissions: ['manage_clients'],
    clients_count: 23,
    contracts_count: 34,
    created_at: '2024-03-20T00:00:00Z'
  },
  {
    id: '3',
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob.johnson@example.com',
    status: 'suspended',
    permissions: ['manage_clients', 'manage_contracts'],
    clients_count: 56,
    contracts_count: 92,
    created_at: '2024-06-10T00:00:00Z'
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'suspended':
      return 'bg-red-100 text-red-800';
    case 'blocked':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'pending':
      return 'En attente';
    case 'suspended':
      return 'Suspendu';
    case 'blocked':
      return 'Bloqué';
    default:
      return status;
  }
};

export function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [agents] = useState<Agent[]>(mockAgents);
  const { user } = useAuthStore();

  if (!user?.permissions?.includes('manage_system')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Accès non autorisé</p>
      </div>
    );
  }

  const filteredAgents = agents.filter(agent =>
    agent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-500">Gérez les agents et leurs permissions</p>
        </div>
        <Button>Ajouter un agent</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Input
            type="text"
            placeholder="Rechercher un agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredAgents.map((agent) => {
          const initials = `${agent.first_name[0]}${agent.last_name[0]}`.toUpperCase();

          return (
            <Card key={agent.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {agent.first_name} {agent.last_name}
                </CardTitle>
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}>
                  {getStatusLabel(agent.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar>
                    {agent.avatar_url ? (
                      <Avatar.Image src={agent.avatar_url} alt={`${agent.first_name} ${agent.last_name}`} />
                    ) : (
                      <Avatar.Fallback>{initials}</Avatar.Fallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {agent.email}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {agent.permissions.includes('manage_clients') && (
                        <div className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Gestion clients
                        </div>
                      )}
                      {agent.permissions.includes('manage_contracts') && (
                        <div className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          Gestion contrats
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{agent.clients_count} clients</p>
                      <p>{agent.contracts_count} contrats</p>
                      <p>Depuis le {new Date(agent.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
