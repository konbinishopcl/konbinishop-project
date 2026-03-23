'use client';

import { useUserStore } from '@/lib/stores';
import { StrapiAuth } from '@/lib/strapi';

export default function DebugAuth() {
  const { user, isAuthenticated } = useUserStore();
  const token = StrapiAuth.getToken();

  return (
    <div className='fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm'>
      <h3 className='font-bold mb-2'>🔐 Auth Debug</h3>
      <div className='space-y-1'>
        <div>
          <strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}
        </div>
        <div>
          <strong>Store Auth:</strong>{' '}
          {isAuthenticated ? '✅ True' : '❌ False'}
        </div>
        <div>
          <strong>User ID:</strong> {user?.documentId || 'None'}
        </div>
        <div>
          <strong>Username:</strong> {user?.username || 'None'}
        </div>
        <div>
          <strong>Email:</strong> {user?.email || 'None'}
        </div>
        <div>
          <strong>Role:</strong> {user?.role?.name || 'None'}
        </div>
      </div>
      {token && (
        <div className='mt-2 text-xs'>
          <strong>Token Preview:</strong> {token.substring(0, 20)}...
        </div>
      )}
    </div>
  );
}
