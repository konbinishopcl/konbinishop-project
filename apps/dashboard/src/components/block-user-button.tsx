'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { StrapiAPI } from '@/lib/strapi/api';
import { useRouter } from 'next/navigation';

interface BlockUserButtonProps {
  userId: number;
  isBlocked: boolean;
}

export default function BlockUserButton({
  userId,
  isBlocked,
}: BlockUserButtonProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const router = useRouter();

  // Handle blocking user
  const handleBlockUser = async () => {
    try {
      setIsBlocking(true);
      await StrapiAPI.updateContent('users', userId.toString(), {
        blocked: true,
      });

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error blocking user:', error);
      // You could show a toast notification here
    } finally {
      setIsBlocking(false);
    }
  };

  // Don't show button if user is already blocked
  if (isBlocked) {
    return null;
  }

  return (
    <button
      onClick={handleBlockUser}
      disabled={isBlocking}
      className='inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      title='Bloquear usuario'
    >
      {isBlocking ? (
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-red-600'></div>
      ) : (
        <Lock size={16} />
      )}
    </button>
  );
}
