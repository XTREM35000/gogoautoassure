import { Link, useLocation } from 'react-router-dom';
import { UserAvatarMenu } from './UserAvatarMenu';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  navigation: NavigationItem[];
  children?: React.ReactNode;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'dashboard':
      return <LayoutDashboard className="w-5 h-5" />;
    case 'contracts':
      return <FileText className="w-5 h-5" />;
    case 'clients':
      return <Users className="w-5 h-5" />;
    case 'settings':
      return <Settings className="w-5 h-5" />;
    case 'notifications':
      return <Bell className="w-5 h-5" />;
    case 'agents':
      return <UserCog className="w-5 h-5" />;
    default:
      return null;
  }
};

export function Sidebar({ navigation }: SidebarProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:bottom-0 md:z-50 transition-all duration-300 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-background border-r border-gray-200 dark:border-gray-800">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-800">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-primary">
                <span className="text-sm font-bold text-white">G3</span>
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Gogo AutoAssure
                </span>
              )}
            </Link>
          </div>
          <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    location.pathname === item.href
                      ? 'bg-orange-50 text-orange-500 dark:bg-orange-500/20 dark:text-orange-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500 dark:text-gray-100 dark:hover:bg-gray-800/50 dark:hover:text-orange-300'
                  }`}
                >
                  {getIcon(item.icon)}
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <UserAvatarMenu />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-40 flex items-center p-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 z-30 p-4 mt-16 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-800 md:hidden"
          >
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === item.href
                      ? 'bg-orange-50 text-orange-500 dark:bg-orange-500/20 dark:text-orange-300'
                      : 'text-gray-600 hover:text-orange-500 dark:text-gray-100 dark:hover:text-orange-300'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {getIcon(item.icon)}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
