import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Search, Edit2, Trash2, MoreVertical, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AvatarUpload } from '@/components/ui/avatar-upload';
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

const PERMISSIONS = [
  { id: 'manage_clients', label: 'Gestion clients' },
  { id: 'manage_contracts', label: 'Gestion contrats' },
  { id: 'manage_system', label: 'Administration système' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'pending', label: 'En attente' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'blocked', label: 'Bloqué' },
];

export function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    status: '',
    permissions: [] as string[],
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'pending',
    permissions: ['manage_clients'] as string[],
  });
  const { user } = useAuthStore();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          status,
          permissions,
          created_at,
          role
        `)
        .or('role.eq.agent,status.eq.pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agents:', error);
        throw error;
      }

      // Filter and transform the data
      const agentsData = (data || []).map(profile => ({
        ...profile,
        clients_count: 0, // These could be added later if needed
        contracts_count: 0
      }));

      console.log('Agents loaded:', agentsData.length);
      setAgents(agentsData);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Erreur lors du chargement des agents');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAgent = async (agent: Agent) => {
    setSelectedAgent(agent);
    setEditForm({
      first_name: agent.first_name,
      last_name: agent.last_name,
      email: agent.email,
      status: agent.status,
      permissions: agent.permissions || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      // Vérifier si l'utilisateur est admin
      if (user?.role !== 'admin') {
        toast.error('Vous n\'avez pas les permissions nécessaires');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      setAgents(agents.filter(a => a.id !== agentId));
      toast.success('Agent supprimé avec succès');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Erreur lors de la suppression de l\'agent');
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    try {
      const updates = {
        ...editForm,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedAgent.id);

      if (error) throw error;

      if (avatar) {
        const fileExt = avatar.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${selectedAgent.id}/${selectedAgent.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        if (urlData) {
          await supabase
            .from('profiles')
            .update({
              avatar_url: urlData.publicUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', selectedAgent.id);
        }
      }

      await fetchAgents();
      setIsEditDialogOpen(false);
      toast.success('Agent mis à jour avec succès');
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Erreur lors de la mise à jour de l\'agent');
    }
  };

  const handleCreateAgent = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addForm.email,
        password: generateTempPassword(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: addForm.first_name,
            last_name: addForm.last_name,
            phone: addForm.phone
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('No user data returned');

      const now = new Date().toISOString();
      const display_name = `${addForm.first_name} ${addForm.last_name}`.trim();

      // Create profile
      const profileData = {
        id: authData.user.id,
        email: addForm.email,
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        phone: addForm.phone,
        created_at: now,
        updated_at: now,
        avatar_url: null,
        role: addForm.status === 'pending' ? 'user' : 'agent',
        status: addForm.status,
        display_name: display_name,
        permissions: addForm.permissions
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profileData]);

      if (profileError) throw profileError;

      await fetchAgents();
      setIsAddDialogOpen(false);
      setAddForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'pending',
        permissions: ['manage_clients']
      });
      toast.success('Agent créé avec succès');
    } catch (error: any) {
      console.error('Error creating agent:', error);
      toast.error(error.message || 'Erreur lors de la création de l\'agent');
    }
  };

  const generateTempPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

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
    return STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;
  };

  if (!user?.permissions?.includes('manage_system')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Accès non autorisé</p>
      </div>
    );
  }

  const filteredAgents = agents.filter(agent =>
    agent.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-500">Gérez les agents et leurs permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter un agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel agent</DialogTitle>
              <DialogDescription>
                Invitez un nouvel agent à rejoindre la plateforme
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Prénom</label>
                  <Input
                    value={addForm.first_name}
                    onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nom</label>
                  <Input
                    value={addForm.last_name}
                    onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  type="email"
                  placeholder="john.doe@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Téléphone</label>
                <Input
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  type="tel"
                  placeholder="+225 XX XX XX XX XX"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Statut</label>
                <Select
                  value={addForm.status}
                  onValueChange={(value) => setAddForm({ ...addForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Permissions</label>
                <div className="space-y-2">
                  {PERMISSIONS.map((permission) => (
                    <label key={permission.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={addForm.permissions.includes(permission.id)}
                        onChange={(e) => {
                          const newPermissions = e.target.checked
                            ? [...addForm.permissions, permission.id]
                            : addForm.permissions.filter(p => p !== permission.id);
                          setAddForm({ ...addForm, permissions: newPermissions });
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateAgent}>
                Créer l'agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-500">Chargement des agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun agent trouvé</p>
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`.toUpperCase();

            return (
              <Card key={agent.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {agent.first_name} {agent.last_name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}>
                      {getStatusLabel(agent.status)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer cet agent ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAgent(agent.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                        {agent.permissions?.map(permission => {
                          const permissionInfo = PERMISSIONS.find(p => p.id === permission);
                          return (
                            <div
                              key={permission}
                              className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                            >
                              {permissionInfo?.label || permission}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>{agent.clients_count || 0} clients</p>
                        <p>{agent.contracts_count || 0} contrats</p>
                        <p>Depuis le {new Date(agent.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'agent</DialogTitle>
            <DialogDescription>
              Modifiez les informations et les permissions de l'agent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center mb-4">
              <AvatarUpload
                avatarUrl={selectedAgent?.avatar_url}
                onFileSelect={(file) => setAvatar(file)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Prénom</label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nom</label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                type="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Statut</label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Permissions</label>
              <div className="space-y-2">
                {PERMISSIONS.map((permission) => (
                  <label key={permission.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editForm.permissions.includes(permission.id)}
                      onChange={(e) => {
                        const newPermissions = e.target.checked
                          ? [...editForm.permissions, permission.id]
                          : editForm.permissions.filter(p => p !== permission.id);
                        setEditForm({ ...editForm, permissions: newPermissions });
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateAgent}>
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
