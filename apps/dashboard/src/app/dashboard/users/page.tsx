import ServerPagination from '@/components/server-pagination';
import { StrapiAPI } from '@/lib/strapi/api';
import { Eye } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

// Interface for user data from Strapi
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
  // Note: role field is not returned by /api/users endpoint
}

// Get users from Strapi API with pagination
async function getUsers(
  page: number = 1,
  pageSize: number = 25
): Promise<{
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}> {
  try {
    // Since users endpoint doesn't support pagination, we'll get all and paginate manually
    const response = await StrapiAPI.getUsers();
    const allUsers = response.data as User[];
    const total = allUsers.length;
    const pageCount = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const users = allUsers.slice(startIndex, endIndex);

    return {
      users,
      pagination: { page, pageSize, pageCount, total },
    };
  } catch (error) {
    throw error;
  }
}

export const metadata: Metadata = {
  title: 'Usuarios | Konbini',
  description:
    'Gestiona todos los usuarios del sistema. Administra perfiles, roles y permisos de acceso.',
  keywords: 'konbini, dashboard, admin, usuarios, gestión, perfiles, permisos',
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;

  let users: User[] = [];
  let pagination = { page: 1, pageSize: 25, pageCount: 1, total: 0 };
  let error: string | null = null;

  try {
    const result = await getUsers(currentPage, 25);
    users = result.users;
    pagination = result.pagination;
  } catch {
    error = 'Error al cargar los usuarios';
  }

  return (
    <div className='p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Usuarios</h1>
              <p className='text-gray-600 mt-2'>
                Gestiona los usuarios del sistema • {pagination.total} usuarios
                registrados
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <div className='text-red-400'>
                <svg
                  className='h-5 w-5'
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
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Usuario
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Email
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
                {users.map(user => (
                  <tr key={user.id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='flex-shrink-0 h-10 w-10'>
                          <div className='h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center'>
                            <span className='text-sm font-medium text-gray-700'>
                              {user.firstname?.charAt(0).toUpperCase() ||
                                user.username?.charAt(0).toUpperCase() ||
                                'U'}
                            </span>
                          </div>
                        </div>
                        <div className='ml-4'>
                          <Link
                            href={`/dashboard/users/${user.id}`}
                            className='text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 underline transition-colors'
                          >
                            {user.firstname && user.lastname
                              ? `${user.firstname} ${user.lastname}`
                              : user.username}
                          </Link>
                          <div className='text-sm text-gray-500'>
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{user.email}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.confirmed && !user.blocked
                            ? 'bg-green-100 text-green-800'
                            : user.blocked
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {user.blocked
                          ? 'Bloqueado'
                          : user.confirmed
                            ? 'Activo'
                            : 'Pendiente'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-500'>
                        {new Date(user.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex items-center space-x-2'>
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className='inline-flex items-center justify-center p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 hover:bg-[var(--brand-primary)]/10 rounded-lg transition-colors'
                          title='Ver usuario'
                        >
                          <Eye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {users.length === 0 && !error && (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
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
                No hay usuarios
              </h3>
              <p className='text-gray-500 mb-6'>
                Comienza creando tu primer usuario.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {users.length > 0 && (
          <div className='mt-6'>
            <ServerPagination
              currentPage={pagination.page}
              totalPages={pagination.pageCount}
              totalItems={pagination.total}
              itemsPerPage={pagination.pageSize}
              baseUrl='/dashboard/users'
            />
          </div>
        )}
      </div>
    </div>
  );
}
