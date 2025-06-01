import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DashboardStats {
  totalClients: number
  pendingUsers: number
  activeUsers: number
  totalContracts: number
  activeContracts: number
  pendingContracts: number
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    pendingUsers: 0,
    activeUsers: 0,
    totalContracts: 0,
    activeContracts: 0,
    pendingContracts: 0
  })

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Vérifier d'abord le rôle de l'utilisateur
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, permissions')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error("Error fetching user profile:", profileError)
        return
      }

      // Si l'utilisateur est admin ou agent, récupérer les statistiques
      if (userProfile.role === 'admin' || userProfile.role === 'agent') {
        const [clientsCount, usersStats, contractsStats] = await Promise.all([
          // Nombre total de clients
          supabase
            .from('clients')
            .select('id', { count: 'exact', head: true }),

          // Statistiques des utilisateurs
          supabase
            .from('profiles')
            .select('status'),

          // Statistiques des contrats
          supabase
            .from('contracts')
            .select('status')
        ])

        if (clientsCount.error && clientsCount.error.code !== '42P01') {
          throw clientsCount.error
        }

        if (usersStats.error) {
          throw usersStats.error
        }

        if (contractsStats.error && contractsStats.error.code !== '42P01') {
          throw contractsStats.error
        }

        const pendingUsers = usersStats.data?.filter(u => u.status === 'pending').length || 0
        const activeUsers = usersStats.data?.filter(u => u.status === 'active').length || 0

        const activeContracts = contractsStats.data?.filter(c => c.status === 'active').length || 0
        const pendingContracts = contractsStats.data?.filter(c => c.status === 'pending').length || 0

        setStats({
          totalClients: clientsCount.count || 0,
          pendingUsers,
          activeUsers,
          totalContracts: contractsStats.data?.length || 0,
          activeContracts,
          pendingContracts
        })
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      toast.error("Erreur lors du chargement des statistiques")
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Clients</h2>
          <p className="text-3xl font-bold">{stats.totalClients}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Utilisateurs en attente</h2>
          <p className="text-3xl font-bold">{stats.pendingUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Utilisateurs actifs</h2>
          <p className="text-3xl font-bold">{stats.activeUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Contrats</h2>
          <p className="text-3xl font-bold">{stats.totalContracts}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Contrats actifs</h2>
          <p className="text-3xl font-bold">{stats.activeContracts}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Contrats en attente</h2>
          <p className="text-3xl font-bold">{stats.pendingContracts}</p>
        </div>
      </div>
    </div>
  )
}
