import { BlockUserButtonInline } from '@/components/block-user-button-inline';
import { StrapiAPI } from '@/lib/strapi/api';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  Hash,
  Mail,
  MapPin,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

interface User {
  id: number;
  documentId: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  rut: string;
  is_company: boolean;
  firstname: string;
  lastname: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface UserEvent {
  id: number;
  documentId: string;
  title: string;
  description: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    documentId: string;
    username: string;
    firstname?: string;
    lastname?: string;
  };
  category?: { id: number; documentId: string; name: string };
  banner?: {
    id: number;
    url: string;
    alternativeText?: string;
  };
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = (await StrapiAPI.getUser(id)) as User | null;

  if (!user) {
    return {
      title: 'Usuario no encontrado | Konbini',
      description: 'El usuario que buscas no existe o ha sido eliminado.',
    };
  }

  const userName =
    user.firstname && user.lastname
      ? `${user.firstname} ${user.lastname}`
      : user.username;

  return {
    title: `${userName} | Usuario | Konbini`,
    description: `Perfil del usuario ${userName} en el sistema Konbini.`,
    keywords: `konbini, dashboard, admin, usuario, ${userName}, perfil, gestión`,
  };
}

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await StrapiAPI.getUser(id)) as User | null;

  // Get events by user ID
  let userEvents: UserEvent[] = [];
  if (user) {
    try {
      const events = await StrapiAPI.getEvents(1, 1000); // Get all events
      userEvents =
        (events.data as UserEvent[]).filter(
          (event: UserEvent) => event.user?.id === user.id
        ) || [];
    } catch (error) {
      console.error('Error getting user events:', error);
    }
  }

  // Get current user to check if trying to block self
  let currentUser = null;
  try {
    currentUser = await StrapiAPI.getMe();
  } catch (error) {
    console.error('Error getting current user:', error);
  }

  if (!user) {
    return (
      <div className='p-6'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center py-12'>
            <div className='text-red-400 mb-4'>
              <svg
                className='mx-auto h-12 w-12'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Usuario no encontrado
            </h3>
            <p className='text-gray-500 mb-6'>
              El usuario que buscas no existe o ha sido eliminado.
            </p>
            <Link
              href='/dashboard/users'
              className='inline-flex items-center px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand-primary)]/80 transition-colors'
            >
              <ArrowLeft size={16} className='mr-2' />
              Volver a Usuarios
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (confirmed: boolean, blocked: boolean) => {
    if (blocked) {
      return (
        <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800'>
          <XCircle size={16} className='mr-2' />
          Bloqueado
        </span>
      );
    }
    if (confirmed) {
      return (
        <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
          <CheckCircle size={16} className='mr-2' />
          Activo
        </span>
      );
    }
    return (
      <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
        <Calendar size={16} className='mr-2' />
        Pendiente
      </span>
    );
  };

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/dashboard/users'
                className='inline-flex items-center text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:underline transition-colors'
              >
                <ArrowLeft size={20} className='mr-2' />
                Volver a Usuarios
              </Link>
            </div>
            <div className='flex items-center space-x-3'>
              <BlockUserButtonInline
                userId={user.id.toString()}
                isBlocked={user.blocked}
                currentUserId={currentUser?.id?.toString()}
              />
            </div>
          </div>
          <div className='mt-4'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Detalles del Usuario
            </h1>
            <p className='text-gray-600 mt-2'>
              Información completa del usuario{' '}
              {user.firstname && user.lastname
                ? `${user.firstname} ${user.lastname}`
                : user.username}
            </p>
          </div>
        </div>

        {/* User Status */}
        <div className='mb-6'>
          {getStatusBadge(user.confirmed, user.blocked)}
        </div>

        {/* Two Column Layout with Separate Cards */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column - Main Information (2/3 width) */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg border border-gray-200 p-8 h-full'>
              <div className='space-y-8'>
                {/* Basic Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <User
                      size={20}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información Básica
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        ID de Usuario:{' '}
                      </span>
                      <span className='slug-text'>#{user.id}</span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Nombre:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {user.firstname && user.lastname
                          ? `${user.firstname} ${user.lastname}`
                          : 'No especificado'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Nombre de Usuario:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {user.username}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Email:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {user.email}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        RUT:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {user.rut || 'No especificado'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Tipo de Cuenta:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {user.is_company ? 'Empresa' : 'Persona Natural'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                    <Hash size={20} className='mr-2 text-green-600' />
                    Información del Sistema
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Proveedor:{' '}
                      </span>
                      <span className='text-sm text-gray-900 capitalize'>
                        {user.provider}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Confirmado:{' '}
                      </span>
                      <span
                        className={`text-sm ${user.confirmed ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {user.confirmed ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Bloqueado:{' '}
                      </span>
                      <span
                        className={`text-sm ${user.blocked ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {user.blocked ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Fecha de Creación:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Última Actualización:{' '}
                      </span>
                      <span className='text-sm text-gray-900'>
                        {formatDate(user.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg border border-gray-200 p-6 h-full'>
              <div className='space-y-6'>
                {/* Account Status */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <Shield size={18} className='mr-2 text-purple-600' />
                    Estado de la Cuenta
                  </h3>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Confirmado</span>
                      <span
                        className={`text-sm font-medium ${user.confirmed ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {user.confirmed ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Bloqueado</span>
                      <span
                        className={`text-sm font-medium ${user.blocked ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {user.blocked ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <Mail
                      size={18}
                      className='mr-2 text-[var(--brand-primary)]'
                    />
                    Información de Contacto
                  </h3>
                  <div className='space-y-2'>
                    <div>
                      <span className='text-sm text-gray-600'>Email</span>
                      <div className='text-sm text-gray-900 break-all'>
                        {user.email}
                      </div>
                    </div>
                    {user.rut && (
                      <div>
                        <span className='text-sm text-gray-600'>RUT</span>
                        <div className='text-sm text-gray-900'>{user.rut}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Type */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-3 flex items-center'>
                    <MapPin size={18} className='mr-2 text-orange-600' />
                    Tipo de Cuenta
                  </h3>
                  <div className='text-sm text-gray-900'>
                    {user.is_company ? 'Cuenta Empresarial' : 'Cuenta Personal'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Events Section */}
        <div className='mt-8'>
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-medium text-gray-900 flex items-center'>
                <Calendar
                  size={20}
                  className='mr-2 text-[var(--brand-primary)]'
                />
                Eventos del Usuario ({userEvents.length})
              </h3>
            </div>

            {userEvents.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Imagen
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Título
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Categoría
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Estado
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Fecha de Creación
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {userEvents.map(event => (
                      <tr key={event.id}>
                        <td className='px-6 py-4'>
                          <div className='flex items-center justify-center'>
                            {event.banner ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${event.banner.url}`}
                                  alt={
                                    event.banner.alternativeText || event.title
                                  }
                                  className='w-16 h-16 object-cover rounded-full'
                                />
                              </>
                            ) : (
                              <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center'>
                                <span className='text-gray-400 text-xs'>
                                  Sin imagen
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='max-w-xs'>
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              className='text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors block truncate'
                              title={event.title}
                            >
                              {event.title.length > 30
                                ? `${event.title.substring(0, 30)}...`
                                : event.title}
                            </Link>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900'>
                            {event.category ? (
                              <Link
                                href={`/dashboard/categories/${event.category.id}`}
                                className='text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                              >
                                {event.category.name}
                              </Link>
                            ) : (
                              'Sin categoría'
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.publishedAt
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {event.publishedAt ? 'Publicado' : 'Borrador'}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-500'>
                            {formatDate(event.createdAt)}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          <div className='flex items-center space-x-2'>
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                              title='Ver evento'
                            >
                              <Eye size={16} />
                            </Link>
                            <Link
                              href={`/dashboard/events/${event.id}/edit`}
                              className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                              title='Editar evento'
                            >
                              <Edit size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='text-center py-12'>
                <div className='text-gray-400 mb-4'>
                  <Calendar className='mx-auto h-12 w-12' />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No hay eventos
                </h3>
                <p className='text-gray-500'>
                  Este usuario aún no ha creado ningún evento.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
