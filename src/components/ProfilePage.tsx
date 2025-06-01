import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Profile {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  role: string
  status: string
}

export function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error("Error loading profile:", error)
        toast.error("Erreur lors du chargement du profil")
        return
      }

      setProfile(data)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Une erreur est survenue lors du chargement du profil")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Vous devez être connecté pour modifier votre profil")
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating profile:", error)
        toast.error(error.message || "Une erreur est survenue lors de la mise à jour du profil")
        return
      }

      setProfile(data)
      toast.success("Profil mis à jour avec succès")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev: Profile | null) => prev ? {
      ...prev,
      [name]: value
    } : null)
  }

  if (!profile) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          value={profile.email}
          disabled
          className="bg-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="first_name">Prénom</Label>
        <Input
          id="first_name"
          name="first_name"
          value={profile.first_name}
          onChange={handleChange}
          required
          minLength={2}
        />
      </div>

      <div>
        <Label htmlFor="last_name">Nom</Label>
        <Input
          id="last_name"
          name="last_name"
          value={profile.last_name}
          onChange={handleChange}
          required
          minLength={2}
        />
      </div>

      <div>
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          name="phone"
          value={profile.phone}
          onChange={handleChange}
          required
          pattern="^\+225[0-9]{10}$"
          placeholder="+225XXXXXXXXXX"
        />
      </div>

      <div>
        <Label htmlFor="role">Rôle</Label>
        <Input
          id="role"
          name="role"
          value={profile.role}
          disabled
          className="bg-gray-100"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
      </Button>
    </form>
  )
}
