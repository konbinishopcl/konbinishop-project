import StatsDefault from '@/components/stats-default';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inicio | Konbini',
  description:
    'Panel principal del dashboard de Konbini. Gestiona eventos, artículos, usuarios y más desde un solo lugar.',
  keywords: 'konbini, dashboard, admin, inicio, estadísticas, gestión',
};

export default function DashboardPage() {
  return (
    <div className='p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Welcome section */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Bienvenido al Dashboard
          </h1>
          <p className='text-gray-600'>
            Gestiona tu contenido y configuración desde aquí
          </p>
        </div>

        <StatsDefault />
      </div>
    </div>
  );
}
