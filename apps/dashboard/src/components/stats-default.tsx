'use client';

import {
  Users,
  Calendar,
  FileText,
  Tag,
  MapPin,
  Building2,
  Hash,
  Image as ImageIcon,
  Megaphone,
} from 'lucide-react';
import StatsCard from '@/components/stats-card';
import { StrapiAPI } from '@/lib/strapi/api';
import { useEffect, useState } from 'react';

// Interfaz para las estadísticas del dashboard
interface DashboardStats {
  data: {
    article: {
      total: number;
      published: number;
      draft: number;
    };
    user: {
      total: number;
      active: number;
      pending: number;
      blocked: number;
    };
    event: {
      total: number;
      rejected: number;
      pending: number;
      archived: number;
      active: number;
    };
    hero: {
      total: number;
      active: number;
      archived: number;
    };
    spot: {
      total: number;
      active: number;
      archived: number;
    };
    category: number;
    commune: number;
    region: number;
    tag: number;
  };
}

export default function StatsDefault() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener estadísticas reales
  const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
      const stats = await StrapiAPI.getDashboardStats();

      // Validar que la respuesta tenga la estructura correcta
      if (
        stats &&
        typeof stats === 'object' &&
        'data' in stats &&
        stats.data &&
        typeof stats.data === 'object' &&
        'event' in stats.data &&
        'article' in stats.data &&
        'user' in stats.data &&
        'hero' in stats.data &&
        'spot' in stats.data
      ) {
        return stats as DashboardStats;
      }

      // Si la estructura no es correcta, lanzar error para usar fallback
      throw new Error('Invalid stats structure');
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      // Retornar datos por defecto en caso de error
      return {
        data: {
          article: { total: 0, published: 0, draft: 0 },
          user: { total: 0, active: 0, pending: 0, blocked: 0 },
          event: { total: 0, rejected: 0, pending: 0, archived: 0, active: 0 },
          hero: { total: 0, active: 0, archived: 0 },
          spot: { total: 0, active: 0, archived: 0 },
          category: 0,
          commune: 0,
          region: 0,
          tag: 0,
        },
      };
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statsData = await getDashboardStats();
        setStats(statsData);
      } catch (error) {
        setError('Error al cargar las estadísticas');
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-gray-600'>Cargando estadísticas...</div>
      </div>
    );
  }

  if (error || !stats || !stats.data) {
    return (
      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
        <p className='text-yellow-800'>
          No se pudieron cargar las estadísticas del dashboard en este momento.
        </p>
      </div>
    );
  }

  // Validación adicional para asegurar que todos los campos necesarios existan
  if (
    !stats.data.event ||
    !stats.data.article ||
    !stats.data.user ||
    !stats.data.hero ||
    !stats.data.spot
  ) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-800'>
          Las estadísticas del dashboard están incompletas. Por favor, recarga
          la página.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Stats cards - Todas juntas */}
      <div className='grid grid-cols-4 gap-6 mb-8'>
        <StatsCard
          icon={Calendar}
          number={stats.data.event.total}
          title='Eventos'
          description={`<strong>${stats.data.event.active}</strong> activos, <strong>${stats.data.event.pending}</strong> pendientes, <strong>${stats.data.event.rejected}</strong> rechazados, <strong>${stats.data.event.archived}</strong> archivados`}
        />

        <StatsCard
          icon={FileText}
          number={stats.data.article.total}
          title='Artículos'
          description={`<strong>${stats.data.article.published}</strong> publicados, <strong>${stats.data.article.draft}</strong> borradores`}
        />

        <StatsCard
          icon={ImageIcon}
          number={stats.data.hero.total}
          title='Heros'
          description={`<strong>${stats.data.hero.active}</strong> activos, <strong>${stats.data.hero.archived}</strong> archivados`}
        />

        <StatsCard
          icon={Megaphone}
          number={stats.data.spot.total}
          title='Spots'
          description={`<strong>${stats.data.spot.active}</strong> activos, <strong>${stats.data.spot.archived}</strong> archivados`}
        />

        <StatsCard
          icon={Users}
          number={stats.data.user.total}
          title='Usuarios'
          description={`<strong>${stats.data.user.active}</strong> activos, <strong>${stats.data.user.pending}</strong> pendientes, <strong>${stats.data.user.blocked}</strong> bloqueados`}
        />

        <StatsCard icon={Tag} number={stats.data.category} title='Categorías' />

        <StatsCard icon={Hash} number={stats.data.tag} title='Etiquetas' />

        <StatsCard icon={MapPin} number={stats.data.region} title='Regiones' />

        <StatsCard
          icon={Building2}
          number={stats.data.commune}
          title='Comunas'
        />
      </div>

      {/* Content summary card */}
      <div className='bg-white p-6 rounded-lg border border-gray-200 mb-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Resumen del Contenido
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-sm font-medium text-gray-500'>
              Total de Contenido
            </p>
            <p className='text-sm text-gray-900'>
              {stats.data.event.total +
                stats.data.article.total +
                stats.data.hero.total +
                stats.data.spot.total}{' '}
              elementos
            </p>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-500'>Eventos Activos</p>
            <p className='text-sm text-gray-900'>
              {stats.data.event.active} de {stats.data.event.total}
            </p>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-500'>
              Artículos Publicados
            </p>
            <p className='text-sm text-gray-900'>
              {stats.data.article.published} de {stats.data.article.total}
            </p>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-500'>
              Categorías Disponibles
            </p>
            <p className='text-sm text-gray-900'>
              {stats.data.category} categorías
            </p>
          </div>
        </div>
      </div>

      {/* Análisis detallado */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Estado de Usuarios */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Estado de Usuarios
          </h2>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Usuarios Activos</span>
              <span className='text-sm font-semibold text-green-600'>
                {stats.data.user.active}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Usuarios Pendientes</span>
              <span className='text-sm font-semibold text-yellow-600'>
                {stats.data.user.pending}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Usuarios Bloqueados</span>
              <span className='text-sm font-semibold text-red-600'>
                {stats.data.user.blocked}
              </span>
            </div>
          </div>
        </div>

        {/* Estado de Eventos */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Estado de Eventos
          </h2>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Eventos Activos</span>
              <span className='text-sm font-semibold text-green-600'>
                {stats.data.event.active}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Eventos Pendientes</span>
              <span className='text-sm font-semibold text-yellow-600'>
                {stats.data.event.pending}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Eventos Archivados</span>
              <span className='text-sm font-semibold text-gray-600'>
                {stats.data.event.archived}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
