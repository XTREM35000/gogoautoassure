import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Car, User, Bell, Menu, X, ShieldCheck, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatarMenu } from '@/components/layout/UserAvatarMenu';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export function RootLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const navItems = React.useMemo(() => {
    const items = [
      { path: '/', label: 'Tableau de bord', icon: <ShieldCheck size={18} /> },
      { path: '/contracts', label: 'Contrats', icon: <Car size={18} /> },
    ];

    if (user?.role === 'agent_junior' || user?.role === 'agent_senior' || user?.role === 'admin') {
      items.push({
        path: '/clients',
        label: 'Clients',
        icon: <User size={18} />
      });
    }

    if (user?.role === 'admin') {
      items.push(
        {
          path: '/agents',
          label: 'Agents',
          icon: <Users size={18} />
        },
        {
          path: '/settings',
          label: 'Paramètres',
          icon: <Settings size={18} />
        }
      );
    }

    return items;
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto md:px-6">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-primary">
                <span className="text-sm font-bold text-white">G3</span>
              </div>
              <span className="hidden text-xl font-bold text-gray-900 md:block">
                Gogo AutoAssure
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex md:items-center md:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-orange-500'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                </Button>

                <UserAvatarMenu />

                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={toggleMobileMenu}
                >
                  {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 z-30 p-4 mt-16 bg-white border-b border-gray-200 md:hidden"
          >
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === item.path
                      ? 'bg-orange-50 text-orange-500'
                      : 'text-gray-600 hover:text-orange-500'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 container px-4 mx-auto py-6 md:px-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-6 bg-gray-100 border-t border-gray-200">
        <div className="container px-4 mx-auto md:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Gogo AutoAssure Abidjan. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-sm text-gray-500 hover:text-orange-500">
                Confidentialité
              </Link>
              <Link to="/terms" className="text-sm text-gray-500 hover:text-orange-500">
                Conditions d'utilisation
              </Link>
              <Link to="/contact" className="text-sm text-gray-500 hover:text-orange-500">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
