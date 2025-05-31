import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  ArrowDown, 
  ArrowUp, 
  Car,
  CircleDollarSign,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatDate, calculateDaysRemaining } from '@/lib/utils';

// Mock data
const mockContracts = [
  {
    id: '1',
    vehicle: 'Toyota Corolla',
    registration_number: '1234 AB 01',
    policy_number: 'G3A-123456-7890',
    premium_amount: 150000,
    start_date: '2023-06-01T00:00:00Z',
    end_date: '2024-05-31T23:59:59Z',
    status: 'active'
  },
  {
    id: '2',
    vehicle: 'Honda Civic',
    registration_number: '5678 CD 01',
    policy_number: 'G3A-234567-8901',
    premium_amount: 180000,
    start_date: '2023-01-15T00:00:00Z',
    end_date: '2024-01-14T23:59:59Z',
    status: 'active'
  },
  {
    id: '3',
    vehicle: 'Peugeot 308',
    registration_number: '9012 EF 01',
    policy_number: 'G3A-345678-9012',
    premium_amount: 120000,
    start_date: '2022-11-20T00:00:00Z',
    end_date: '2023-11-19T23:59:59Z',
    status: 'expired'
  }
];

export function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };
  
  const filteredContracts = mockContracts.filter(contract => 
    contract.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.policy_number.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const activeContracts = filteredContracts.filter(contract => contract.status === 'active');
  const expiredContracts = filteredContracts.filter(contract => contract.status === 'expired');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contrats d'assurance</h1>
          <p className="text-gray-500">
            Gérez vos contrats d'assurance automobile
          </p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau contrat
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative w-full md:w-64">
          <Search className="absolute top-0 left-3 h-full text-gray-400" size={18} />
          <Input 
            placeholder="Rechercher un contrat..." 
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
      
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Actifs ({activeContracts.length})</TabsTrigger>
          <TabsTrigger value="expired">Expirés ({expiredContracts.length})</TabsTrigger>
          <TabsTrigger value="all">Tous ({filteredContracts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {activeContracts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeContracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>
        
        <TabsContent value="expired" className="space-y-4">
          {expiredContracts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expiredContracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun contrat expiré" />
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {filteredContracts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ContractCardProps {
  contract: {
    id: string;
    vehicle: string;
    registration_number: string;
    policy_number: string;
    premium_amount: number;
    start_date: string;
    end_date: string;
    status: string;
  };
}

function ContractCard({ contract }: ContractCardProps) {
  const daysRemaining = contract.status === 'active' ? calculateDaysRemaining(contract.end_date) : 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${
              contract.status === 'active' ? 'bg-teal-100' : 'bg-gray-100'
            }`}>
              <Car className={`w-5 h-5 ${
                contract.status === 'active' ? 'text-teal-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h3 className="text-base font-medium">{contract.vehicle}</h3>
              <p className="text-sm text-gray-500">{contract.registration_number}</p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            contract.status === 'active' 
              ? 'bg-teal-100 text-teal-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {contract.status === 'active' ? 'Actif' : 'Expiré'}
          </span>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Numéro de police</span>
            <span className="text-sm font-medium">{contract.policy_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Prime annuelle</span>
            <div className="flex items-center gap-1">
              <CircleDollarSign className="w-3 h-3 text-orange-500" />
              <span className="text-sm font-medium">{formatCurrency(contract.premium_amount)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Période de validité</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-orange-500" />
              <span className="text-sm font-medium">
                {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
              </span>
            </div>
          </div>
        </div>
        
        {contract.status === 'active' && (
          <div className="mb-4 p-2 bg-orange-50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-orange-800">
                Expiration dans
              </span>
              <span className="text-xs font-bold text-orange-800">
                {daysRemaining} jours
              </span>
            </div>
            <div className="mt-1 w-full bg-orange-200 rounded-full h-1.5">
              <div 
                className="bg-orange-500 h-1.5 rounded-full" 
                style={{ 
                  width: `${Math.min(100, (daysRemaining / 365) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1">
            <Download className="w-4 h-4" />
            Vignette
          </Button>
          <Button variant={contract.status === 'active' ? 'default' : 'secondary'} className="flex-1">
            {contract.status === 'active' ? 'Détails' : 'Renouveler'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message = "Aucun contrat trouvé" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
      <Car className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">{message}</h3>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-md">
        Vous n'avez pas encore de contrat d'assurance ou votre recherche n'a retourné aucun résultat.
      </p>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Ajouter un contrat
      </Button>
    </div>
  );
}