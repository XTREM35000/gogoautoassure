import React, { useState } from 'react';
import { 
  Settings, 
  Building, 
  Users, 
  Bell, 
  Shield, 
  Database,
  Mail,
  Phone,
  Globe,
  CreditCard,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function SettingsPage() {
  const [companySettings, setCompanySettings] = useState({
    name: 'Gogo AutoAssure Abidjan',
    email: 'contact@gogoautoassure.ci',
    phone: '+225 27 20 30 40 50',
    address: 'Cocody Riviera 3, Abidjan',
    website: 'www.gogoautoassure.ci',
    rccm: 'CI-ABJ-2023-B-12345',
    taxId: '2023456789',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    contractReminders: true,
    paymentReminders: true,
    marketingEmails: false,
  });

  const [paymentSettings, setPaymentSettings] = useState({
    orangeMoney: true,
    mtnMoney: true,
    moovMoney: true,
    wave: true,
    bankTransfer: true,
  });

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement company settings update
  };

  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePaymentToggle = (method: keyof typeof paymentSettings) => {
    setPaymentSettings(prev => ({
      ...prev,
      [method]: !prev[method]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-gray-500">
          Gérez les paramètres de votre entreprise et de l'application
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Entreprise</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
              <CardDescription>
                Gérez les informations de base de votre entreprise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Nom de l'entreprise
                    </label>
                    <div className="mt-1 relative">
                      <Input
                        id="companyName"
                        value={companySettings.name}
                        onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                      />
                      <Building className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1 relative">
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                      />
                      <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <div className="mt-1 relative">
                      <Input
                        id="companyPhone"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                      />
                      <Phone className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                      Site web
                    </label>
                    <div className="mt-1 relative">
                      <Input
                        id="companyWebsite"
                        value={companySettings.website}
                        onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                      />
                      <Globe className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyRccm" className="block text-sm font-medium text-gray-700">
                      RCCM
                    </label>
                    <div className="mt-1 relative">
                      <Input
                        id="companyRccm"
                        value={companySettings.rccm}
                        onChange={(e) => setCompanySettings({ ...companySettings, rccm: e.target.value })}
                      />
                      <Database className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyTaxId" className="block text-sm font-medium text-gray-700">
                      Numéro fiscal
                    </label>
                    <div className="mt-1 relative">
                      <Input
                        id="companyTaxId"
                        value={companySettings.taxId}
                        onChange={(e) => setCompanySettings({ ...companySettings, taxId: e.target.value })}
                      />
                      <Database className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notification</CardTitle>
              <CardDescription>
                Gérez comment et quand vous recevez des notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Notifications par email</h3>
                    <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                  </div>
                  <Button
                    variant={notificationSettings.emailNotifications ? "default" : "outline"}
                    onClick={() => handleNotificationToggle('emailNotifications')}
                  >
                    {notificationSettings.emailNotifications ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Notifications SMS</h3>
                    <p className="text-sm text-gray-500">Recevoir des notifications par SMS</p>
                  </div>
                  <Button
                    variant={notificationSettings.smsNotifications ? "default" : "outline"}
                    onClick={() => handleNotificationToggle('smsNotifications')}
                  >
                    {notificationSettings.smsNotifications ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Rappels de contrat</h3>
                    <p className="text-sm text-gray-500">Notifications pour les échéances de contrat</p>
                  </div>
                  <Button
                    variant={notificationSettings.contractReminders ? "default" : "outline"}
                    onClick={() => handleNotificationToggle('contractReminders')}
                  >
                    {notificationSettings.contractReminders ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Rappels de paiement</h3>
                    <p className="text-sm text-gray-500">Notifications pour les échéances de paiement</p>
                  </div>
                  <Button
                    variant={notificationSettings.paymentReminders ? "default" : "outline"}
                    onClick={() => handleNotificationToggle('paymentReminders')}
                  >
                    {notificationSettings.paymentReminders ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Emails marketing</h3>
                    <p className="text-sm text-gray-500">Recevoir des offres et promotions</p>
                  </div>
                  <Button
                    variant={notificationSettings.marketingEmails ? "default" : "outline"}
                    onClick={() => handleNotificationToggle('marketingEmails')}
                  >
                    {notificationSettings.marketingEmails ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Méthodes de paiement</CardTitle>
              <CardDescription>
                Gérez les méthodes de paiement acceptées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-md">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Orange Money</h3>
                      <p className="text-sm text-gray-500">Paiement via Orange Money</p>
                    </div>
                  </div>
                  <Button
                    variant={paymentSettings.orangeMoney ? "default" : "outline"}
                    onClick={() => handlePaymentToggle('orangeMoney')}
                  >
                    {paymentSettings.orangeMoney ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-md">
                      <CreditCard className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">MTN Mobile Money</h3>
                      <p className="text-sm text-gray-500">Paiement via MTN Money</p>
                    </div>
                  </div>
                  <Button
                    variant={paymentSettings.mtnMoney ? "default" : "outline"}
                    onClick={() => handlePaymentToggle('mtnMoney')}
                  >
                    {paymentSettings.mtnMoney ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Moov Money</h3>
                      <p className="text-sm text-gray-500">Paiement via Moov Money</p>
                    </div>
                  </div>
                  <Button
                    variant={paymentSettings.moovMoney ? "default" : "outline"}
                    onClick={() => handlePaymentToggle('moovMoney')}
                  >
                    {paymentSettings.moovMoney ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-md">
                      <CreditCard className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Wave</h3>
                      <p className="text-sm text-gray-500">Paiement via Wave</p>
                    </div>
                  </div>
                  <Button
                    variant={paymentSettings.wave ? "default" : "outline"}
                    onClick={() => handlePaymentToggle('wave')}
                  >
                    {paymentSettings.wave ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-md">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Virement bancaire</h3>
                      <p className="text-sm text-gray-500">Paiement par virement bancaire</p>
                    </div>
                  </div>
                  <Button
                    variant={paymentSettings.bankTransfer ? "default" : "outline"}
                    onClick={() => handlePaymentToggle('bankTransfer')}
                  >
                    {paymentSettings.bankTransfer ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Authentification</CardTitle>
                <CardDescription>
                  Gérez les paramètres d'authentification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Double authentification</h3>
                    <p className="text-sm text-gray-500">Sécurisez votre compte avec la 2FA</p>
                  </div>
                  <Button variant="outline">Configurer</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Sessions actives</h3>
                    <p className="text-sm text-gray-500">Gérez vos sessions connectées</p>
                  </div>
                  <Button variant="outline">Voir les sessions</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Gérez les rôles et permissions des utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Rôles utilisateurs</h3>
                    <p className="text-sm text-gray-500">Configurez les rôles</p>
                  </div>
                  <Button variant="outline">Gérer les rôles</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Permissions</h3>
                    <p className="text-sm text-gray-500">Définissez les permissions</p>
                  </div>
                  <Button variant="outline">Gérer les permissions</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}