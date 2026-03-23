'use client';

import { useSwal } from '@/lib/hooks/useSwal';
import { useUserStore } from '@/lib/stores';
import { StrapiAuth } from '@/lib/strapi';
import {
  AlertTriangle,
  Building,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileText,
  Hash,
  Home,
  Image as ImageIcon,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Settings,
  Tag,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, clearUser, hasDashboardRole } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { showConfirm } = useSwal();

  // Validate user role on component mount
  useEffect(() => {
    if (user && !hasDashboardRole()) {
      // User doesn't have dashboard role, clear and redirect
      clearUser();
      StrapiAuth.logout();
      router.push('/login');
    } else {
      setIsValidating(false);
    }
  }, [user, hasDashboardRole, clearUser, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownOpen &&
        !(event.target as Element).closest('.user-dropdown')
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  const handleLogout = () => {
    showConfirm(
      '¿Cerrar sesión?',
      '¿Estás seguro de que quieres cerrar sesión?',
      {
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
      }
    ).then(result => {
      if (result.isConfirmed) {
        // Clear Strapi cookies
        StrapiAuth.logout();

        // Clear user store
        clearUser();

        // Middleware will handle the redirect
      }
    });
  };

  // Show loading while validating
  if (isValidating) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Validando permisos...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have dashboard role
  if (!user || !hasDashboardRole()) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto p-6'>
          <AlertTriangle className='mx-auto h-12 w-12 text-red-500 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Acceso Denegado
          </h3>
          <p className='text-gray-600 mb-4'>
            No tienes permisos para acceder al dashboard. Solo usuarios con rol
            &quot;Dashboard&quot; pueden acceder al sistema.
          </p>
          <button
              onClick={() => {
                clearUser();
                StrapiAuth.logout();
                router.push('/login');
              }}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/dashboard' },
    { icon: CalendarDays, label: 'Eventos', href: '/dashboard/events' },
    { icon: FileText, label: 'Artículos', href: '/dashboard/articles' },
    { icon: ImageIcon, label: 'Heroes', href: '/dashboard/heroes' },
    { icon: Megaphone, label: 'Spots', href: '/dashboard/spots' },
    { icon: Users, label: 'Usuarios', href: '/dashboard/users' },
    { icon: Tag, label: 'Categorías', href: '/dashboard/categories' },
    { icon: Hash, label: 'Etiquetas', href: '/dashboard/tags' },
    { icon: MapPin, label: 'Regiones', href: '/dashboard/regions' },
    { icon: Building, label: 'Comunas', href: '/dashboard/communes' },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className='flex items-center justify-between h-16 px-6 pt-4'>
          <div className='flex items-center'>
            <Image
              src='/logo.svg'
              alt='Konbini Logo'
              width={80}
              height={50}
              priority
              className='h-auto'
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className='lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className='flex-1 px-4 py-6 space-y-2'>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
                style={{
                  backgroundColor: isActive
                    ? 'rgba(255, 91, 73, 0.15)'
                    : 'transparent',
                  ...(isActive && { color: '#FF5B49' }),
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor =
                      'rgba(255, 91, 73, 0.1)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Website link button - at the bottom of sidebar */}
        <div className='px-4 py-6 border-t border-gray-200'>
          <a
            href={process.env.NEXT_PUBLIC_WEB_URL || '#'}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors border border-gray-300 hover:border-red-400'
            style={{
              color: '#FF5B49',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#FF5B49';
              e.currentTarget.style.backgroundColor = 'rgba(255, 91, 73, 0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ExternalLink size={20} />
            <span>Ver Sitio Web</span>
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className='lg:pl-64'>
        {/* Top bar */}
        <div className='sticky top-0 z-30 bg-white border-b border-gray-200'>
          <div className='flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8'>
            <button
              onClick={() => setSidebarOpen(true)}
              className='lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            >
              <Menu size={20} />
            </button>

            <div className='flex-1 lg:hidden' />

            <div className='flex items-center space-x-2'>
              {/* Date - simple and clean */}
              <div className='hidden md:flex items-center space-x-2'>
                <CalendarDays size={16} className='text-gray-400' />
                <span className='text-sm text-gray-600'>
                  {new Date()
                    .toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                    .replace(/^\w/, c => c.toUpperCase())}
                </span>
              </div>
            </div>

            {/* User info - positioned to the right */}
            <div
              className='flex items-center ml-auto user-dropdown'
              style={{ position: 'relative' }}
            >
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className='flex items-center space-x-4 rounded-lg transition-colors'
              >
                <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                  <Users size={20} className='text-blue-600' />
                </div>
                <div className='hidden md:block text-left'>
                  <p className='text-sm font-medium text-gray-900 leading-tight'>
                    {user?.firstname && user?.lastname
                      ? `${user.firstname} ${user?.lastname}`
                      : user?.username || 'Usuario'}
                  </p>
                  <p className='text-xs text-gray-500 leading-tight'>
                    {user?.email || 'Sin email'}
                  </p>
                </div>
                <ChevronDown size={16} className='text-gray-400' />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div
                  className='absolute top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-3 z-50'
                  style={{ right: '0px' }}
                >
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      // Aquí puedes agregar la navegación a configuración
                      router.push('/dashboard/settings');
                    }}
                    className='w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                    style={{ gap: '16px' }}
                  >
                    <Settings
                      size={18}
                      className='text-gray-500 flex-shrink-0'
                    />
                    <span>Configuración</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className='w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors'
                    style={{ gap: '16px' }}
                  >
                    <LogOut size={18} className='text-gray-500 flex-shrink-0' />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className='flex-1'>{children}</main>
      </div>
    </div>
  );
}
