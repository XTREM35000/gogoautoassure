import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  User,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Shield,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { UserRole } from '@/lib/supabase';

// Mock data
const mockAgents = [
  {
    id: '1',
    first_name: 'Adama',
    last_name: 'Koné',
    email: 'adama.kone@g3a.ci',
    phone: '+225 07 07 07 07 07',
    role: 'agent_senior' as UserRole,
    created_at: '2023-01-15T00:00:00Z',
    clients_count: 45,
    contracts_count: 78,
    avatar_url: null,
    status: 'active'
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Touré',
    email: 'sarah.toure@g3a.ci',
    phone: '+225 01 01 01 01 01',
    role: 'agent_junior' as UserRole,
    created_at: '2023-03-20T00:00:00Z',
    clients_count: 23,
    contracts_count: 34,
    avatar_url: null,
    status: 'active'
  },
  {
    id: '3',
    first_name: 'Marc',
    last_name: 'Kouassi',
    email: 'marc.kouassi@g3a.ci',
    phone: '+225 05 05 05 05 05',
    role: 'agent_senior' as UserRole,
    created_at: '2023-06-10T00:00:00Z',
    clients_count: 56,
    contracts_count: 92,
    avatar_url: null,
    status: 'active'
  }
];

export function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = mockAgents.filter(agent =>
    agent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.phone.includes(searchTerm)
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'agent_senior':
        return 'Agent Senior';
      case 'agent_junior':
        return 'Agent Junior';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-gray-500">
            Gérez votre équipe d'agents d'assurance
          </p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel agent
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Agents actifs</CardTitle>
            <Shield className="w-4 h-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAgents.length}</div>
            <p className="text-xs text-gray-500">+2 depuis le mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <UserCheck className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAgents.reduce((sum, agent) => sum + agent.clients_count, 0)}
            </div>
            <p className="text-xs text-gray-500">+15 depuis le mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total contrats</CardTitle>
            <User className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAgents.reduce((sum, agent) => sum + agent.contracts_count, 0)}
            </div>
            <p className="text-xs text-gray-500">+23 depuis le mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative w-full md:w-64">
          <Search className="absolute top-0 left-3 h-full text-gray-400" size={18} />
          <Input
            placeholder="Rechercher un agent..."
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
          <CardTitle>Liste des agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    src={agent.avatar_url}
                    alt={`${agent.first_name} ${agent.last_name}`}
                    fallbackText={`${agent.first_name} ${agent.last_name}`}
                    className="h-12 w-12 bg-orange-100 text-orange-600"
                  />

                  <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{`${agent.first_name} ${agent.last_name}`}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          agent.role === 'agent_senior'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {getRoleLabel(agent.role)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <UserCheck size={14} />
                          <span>{agent.clients_count} clients</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield size={14} />
                          <span>{agent.contracts_count} contrats</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone size={14} />
                      <span>{agent.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail size={14} />
                      <span>{agent.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>Agent depuis le {formatDate(agent.created_at)}</span>
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
