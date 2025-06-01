import { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  User,
  Phone,
  Mail,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';

// Mock data with profile images
const mockClients = [
  {
    id: '1',
    first_name: 'Gogo',
    last_name: 'Fabrice',
    email: 'fgogo@email.com',
    phone: '+225 07 58 33 72 79',
    created_at: '2023-01-15T00:00:00Z',
    contracts_count: 2,
    avatar_url: '/clients/client1.png'
  },
  {
    id: '2',
    first_name: 'Dramne',
    last_name: 'Diallo',
    email: 'dramne.diallo@email.com',
    phone: '+225 01 01 01 01 01',
    created_at: '2023-03-20T00:00:00Z',
    contracts_count: 1,
    avatar_url: '/clients/client2.png'
  },
  {
    id: '3',
    first_name: 'Jean',
    last_name: 'Yao',
    email: 'jean.yao@email.com',
    phone: '+225 05 05 05 05 05',
    created_at: '2023-06-10T00:00:00Z',
    contracts_count: 3,
    avatar_url: '/clients/client3.png'
  }
];

export function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = mockClients.filter(client =>
    client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-gray-500">
            Gérez vos clients et leurs contrats d'assurance
          </p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative w-full md:w-64">
          <Search className="absolute top-0 left-3 h-full text-gray-400" size={18} />
          <Input
            placeholder="Rechercher un client..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex gap-2">
          <Filter size={18} />
          Filtrer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {client.avatar_url ? (
                      <Avatar.Image
                        src={client.avatar_url}
                        alt={`${client.first_name} ${client.last_name}`}
                        className="object-cover"
                      />
                    ) : (
                      <Avatar.Fallback className="bg-orange-100 text-orange-600">
                        {getInitials(client.first_name, client.last_name)}
                      </Avatar.Fallback>
                    )}
                  </Avatar>

                  <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                    <div>
                      <p className="font-medium">{`${client.first_name} ${client.last_name}`}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <User size={14} />
                        <span>{client.contracts_count} contrat{client.contracts_count > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone size={14} />
                      <span>{client.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail size={14} />
                      <span>{client.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>Client depuis le {formatDate(client.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Voir détails
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
