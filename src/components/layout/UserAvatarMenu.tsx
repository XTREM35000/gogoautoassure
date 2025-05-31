import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

export function UserAvatarMenu() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user || !user.role || !user.first_name || !user.last_name) return null;

  const getInitials = (name?: string) => {
    if (!name) return 'G3';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      label: 'Mon profil',
      icon: <User className="w-4 h-4" />,
      onClick: () => navigate('/profile'),
    },
  ];

  if (user.role === 'admin') {
    menuItems.push({
      label: 'Paramètres',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => navigate('/settings'),
    });
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 p-1 rounded-full outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        >
          <Avatar
            src={user.avatar_url}
            alt={user.first_name}
            fallbackText={`${user.first_name} ${user.last_name}`}
            className="bg-orange-100 text-orange-600"
          />
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{`${user.first_name} ${user.last_name}`}</p>
            <p className="text-xs text-gray-500 capitalize">{formatRole(user.role)}</p>
          </div>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={item.onClick}
            className="cursor-pointer"
          >
            {item.icon}
            <span className="ml-2">{item.label}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-500 focus:text-red-500"
        >
          <LogOut className="w-4 h-4" />
          <span className="ml-2">Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
