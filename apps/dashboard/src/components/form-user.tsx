'use client';

import { useSwal } from '@/lib/hooks/useSwal';
import { Save, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  confirmed: boolean;
  blocked: boolean;
}

interface UserFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<UserFormData>;
  userId?: string;
  onSubmit: (data: UserFormData) => Promise<void>;
}

export default function UserForm({
  mode,
  initialData,
  userId,
  onSubmit,
}: UserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const { showSuccess, showError } = useSwal();

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'authenticated',
    confirmed: true,
    blocked: false,
    ...initialData,
  });

  const roles = [
    { value: 'authenticated', label: 'Usuario Autenticado' },
    { value: 'editor', label: 'Editor' },
    { value: 'author', label: 'Autor' },
    { value: 'admin', label: 'Administrador' },
  ];

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username =
        'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // Password validation only for create mode
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Remove confirmPassword and password if editing
      const submitData =
        mode === 'edit'
          ? { ...formData, password: undefined, confirmPassword: undefined }
          : formData;

      await onSubmit(submitData as UserFormData);

      // Show success message
      showSuccess(
        mode === 'create' ? '¡Usuario creado!' : '¡Usuario actualizado!',
        mode === 'create'
          ? 'El usuario ha sido creado exitosamente.'
          : 'Los datos del usuario han sido actualizados exitosamente.',
        {
          confirmButtonText: 'Continuar',
          timer: undefined,
          timerProgressBar: false,
        }
      );

      // Redirect based on mode
      if (mode === 'create') {
        router.push('/dashboard/users');
      } else {
        router.push(`/dashboard/users/${userId}`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : mode === 'create'
            ? 'Error al crear el usuario. Por favor intenta de nuevo.'
            : 'Error al actualizar el usuario. Por favor intenta de nuevo.';

      showError(
        mode === 'create'
          ? 'Error al crear usuario'
          : 'Error al actualizar usuario',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof UserFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Basic Information */}
        <div>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Información Básica
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Nombre de Usuario *
              </label>
              <input
                type='text'
                id='username'
                value={formData.username}
                onChange={e => handleInputChange('username', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Ingresa el nombre de usuario'
              />
              {errors.username && (
                <p className='mt-1 text-sm text-red-600'>{errors.username}</p>
              )}
            </div>

            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Email *
              </label>
              <input
                type='email'
                id='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='usuario@ejemplo.com'
              />
              {errors.email && (
                <p className='mt-1 text-sm text-red-600'>{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Password - Only show for create mode */}
        {mode === 'create' && (
          <div>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Contraseña
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Contraseña *
                </label>
                <input
                  type='password'
                  id='password'
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder='Mínimo 6 caracteres'
                />
                {errors.password && (
                  <p className='mt-1 text-sm text-red-600'>{errors.password}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Confirmar Contraseña *
                </label>
                <input
                  type='password'
                  id='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder='Repite la contraseña'
                />
                {errors.confirmPassword && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Role and Status */}
        <div>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Rol y Estado
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <label
                htmlFor='role'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Rol *
              </label>
              <select
                id='role'
                value={formData.role}
                onChange={e => handleInputChange('role', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className='flex items-center'>
              <input
                type='checkbox'
                id='confirmed'
                checked={formData.confirmed}
                onChange={e => handleInputChange('confirmed', e.target.checked)}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label
                htmlFor='confirmed'
                className='ml-2 block text-sm text-gray-700'
              >
                Usuario confirmado
              </label>
            </div>

            <div className='flex items-center'>
              <input
                type='checkbox'
                id='blocked'
                checked={formData.blocked}
                onChange={e => handleInputChange('blocked', e.target.checked)}
                className='h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded'
              />
              <label
                htmlFor='blocked'
                className='ml-2 block text-sm text-gray-700'
              >
                Usuario bloqueado
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className='flex items-center justify-end space-x-4 pt-6 border-t border-gray-200'>
          <button
            type='button'
            onClick={() => router.back()}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Cancelar
          </button>
          <button
            type='submit'
            disabled={loading}
            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {loading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                {mode === 'create' ? 'Creando...' : 'Guardando...'}
              </>
            ) : (
              <>
                {mode === 'create' ? (
                  <UserPlus size={16} className='mr-2' />
                ) : (
                  <Save size={16} className='mr-2' />
                )}
                {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
