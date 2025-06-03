import { useState } from 'react'
import { supabase, formatPhoneNumber, validatePhoneNumber } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface FormErrors {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  phone?: string
}

interface FormData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
}

export function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  })

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.email) newErrors.email = 'Email requis'
    if (!formData.password) newErrors.password = 'Mot de passe requis'
    if (!formData.firstName) newErrors.firstName = 'Prénom requis'
    if (!formData.lastName) newErrors.lastName = 'Nom requis'
    if (!formData.phone) newErrors.phone = 'Téléphone requis'

    if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }

    setLoading(true)
    const formattedPhone = formatPhoneNumber(formData.phone)

    try {
      // Vérifier s'il existe déjà des utilisateurs pour déterminer si c'est le premier
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError

      // Déterminer le rôle (admin si premier utilisateur, agent sinon)
      const isFirstUser = count === 0
      const userRole = isFirstUser ? 'admin' : 'agent'
      const userStatus = isFirstUser ? 'active' : 'pending'

      // Créer l'utilisateur
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            phone: formattedPhone,
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: userRole,
            status: userStatus,
            permissions: isFirstUser ? ['manage_system', 'manage_clients', 'manage_contracts'] : ['manage_clients']
          }
        }
      })

      if (signUpError) throw signUpError

      if (data?.user) {
        const profileData = {
          id: data.user.id,
          email: formData.email,
          phone: formattedPhone,
          first_name: formData.firstName,
          last_name: formData.lastName,
          display_name: `${formData.firstName} ${formData.lastName}`,
          role: userRole,
          status: userStatus,
          permissions: isFirstUser ? ['manage_system', 'manage_clients', 'manage_contracts'] : ['manage_clients'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData])

        if (profileError) throw profileError

        toast.success(isFirstUser
          ? "Compte administrateur créé avec succès ! Veuillez vous connecter."
          : "Compte créé avec succès ! Un administrateur doit valider votre compte."
        )
      }
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error)

      if (error.message.includes("duplicate key")) {
        toast.error("Cette adresse email est déjà utilisée")
      } else {
        toast.error(error.message || "Une erreur est survenue lors de l'inscription")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="firstName">Prénom</Label>
        <Input
          id="firstName"
          name="firstName"
          required
          value={formData.firstName}
          onChange={handleChange}
          placeholder="John"
          className={errors.firstName ? "border-red-500" : ""}
        />
        {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
      </div>

      <div>
        <Label htmlFor="lastName">Nom</Label>
        <Input
          id="lastName"
          name="lastName"
          required
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Doe"
          className={errors.lastName ? "border-red-500" : ""}
        />
        {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="john.doe@example.com"
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          value={formData.phone}
          onChange={handleChange}
          placeholder="+225 XX XX XX XX XX"
          className={errors.phone ? "border-red-500" : ""}
        />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Création du compte..." : "Créer un compte"}
      </Button>
    </form>
  )
}
