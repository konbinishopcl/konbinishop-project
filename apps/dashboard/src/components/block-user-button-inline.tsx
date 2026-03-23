'use client';

import { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { StrapiAPI } from '@/lib/strapi/api';
import { useRouter } from 'next/navigation';

interface BlockUserButtonInlineProps {
  userId: string;
  isBlocked: boolean;
  currentUserId?: string; // documentId of the currently logged in user
}

export function BlockUserButtonInline({
  userId,
  isBlocked,
  currentUserId,
}: BlockUserButtonInlineProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const router = useRouter();

  // Check if this is the current user (you can't block yourself)
  const isCurrentUser = currentUserId && currentUserId === userId;

  // Handle blocking/unblocking user
  const handleToggleBlockUser = async () => {
    try {
      setIsBlocking(true);
      console.log(
        `Attempting to ${isBlocked ? 'unblock' : 'block'} user ${userId}`
      );
      console.log('Sending data:', { blocked: !isBlocked });

      const response = await StrapiAPI.updateUser(userId.toString(), {
        blocked: !isBlocked,
      });

      console.log('Strapi response:', response);
      console.log('Response blocked field:', response?.blocked);
      console.log(
        `Successfully ${isBlocked ? 'unblocked' : 'blocked'} user ${userId}`
      );

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error(
        `Error ${isBlocked ? 'unblocking' : 'blocking'} user:`,
        error
      );
      // You could show a toast notification here
    } finally {
      setIsBlocking(false);
    }
  };

  // Don't show button if this is the current user
  if (isCurrentUser) {
    return (
      <div
        className='inline-flex items-center px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-lg cursor-not-allowed'
        title='No puedes bloquear tu propia cuenta'
      >
        <Lock size={16} className='mr-2' />
        No puedes bloquear tu propia cuenta
      </div>
    );
  }

  return (
    <button
      onClick={handleToggleBlockUser}
      disabled={isBlocking}
      className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isBlocked
          ? 'bg-green-600 hover:bg-green-700'
          : 'bg-red-600 hover:bg-red-700'
      }`}
      title={isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
    >
      {isBlocking ? (
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
      ) : (
        <>
          {isBlocked ? (
            <Unlock size={16} className='mr-2' />
          ) : (
            <Lock size={16} className='mr-2' />
          )}
          {isBlocked ? 'Desbloquear' : 'Bloquear'}
        </>
      )}
    </button>
  );
}
