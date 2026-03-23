'use client';

import { Plus, Share2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EventSocialLinksFieldProps {
  socialLinks?: Array<{ link: string }>;
  onSocialLinksChange: (socialLinks: Array<{ link: string }>) => void;
  errors?: Array<{
    link?: { message: string };
  }>;
}

export default function EventSocialLinksField({
  socialLinks = [],
  onSocialLinksChange,
  errors,
}: EventSocialLinksFieldProps) {
  const [localSocialLinks, setLocalSocialLinks] =
    useState<Array<{ link: string }>>(socialLinks);

  // Sincronizar con el prop socialLinks
  useEffect(() => {
    setLocalSocialLinks(socialLinks);
  }, [socialLinks]);

  // Función única para actualizar enlaces sociales
  const updateSocialLinks = (newSocialLinks: Array<{ link: string }>) => {
    setLocalSocialLinks(newSocialLinks);
    onSocialLinksChange(newSocialLinks);
  };

  // Función para validar que la URL sea de una red social conocida con usuario
  const isValidSocialMediaUrl = (url: string): boolean => {
    if (!url.trim()) return false;

    const socialMediaPatterns = [
      /^https?:\/\/(www\.)?instagram\.com\/[^\/\s]+/i,
      /^https?:\/\/(www\.)?facebook\.com\/[^\/\s]+/i,
      /^https?:\/\/(www\.)?twitter\.com\/[^\/\s]+/i,
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[^\/\s]+/i,
      /^https?:\/\/(www\.)?youtube\.com\/(channel\/|c\/|user\/)[^\/\s]+/i,
      /^https?:\/\/(www\.)?tiktok\.com\/@[^\/\s]+/i,
      /^https?:\/\/(www\.)?x\.com\/[^\/\s]+/i,
    ];

    return socialMediaPatterns.some(pattern => pattern.test(url));
  };

  // Verificar si se puede agregar un nuevo enlace (todos los campos anteriores deben estar completos y válidos)
  const canAddNewLink =
    localSocialLinks.length === 0 ||
    localSocialLinks.every(
      link => link.link && isValidSocialMediaUrl(link.link)
    );

  const addSocialLink = () => {
    if (canAddNewLink) {
      updateSocialLinks([...localSocialLinks, { link: '' }]);
    }
  };

  const removeSocialLink = (index: number) => {
    updateSocialLinks(localSocialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, url: string) => {
    const newSocialLinks = [...localSocialLinks];
    newSocialLinks[index] = { ...newSocialLinks[index], link: url };
    updateSocialLinks(newSocialLinks);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col space-y-1'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center'>
            <Share2 size={20} className='mr-2 text-[var(--brand-primary)]' />
            Redes Sociales
          </h3>
          <p className='text-sm text-gray-600'>
            Agrega enlaces a las redes sociales del evento
          </p>
        </div>

        <button
          type='button'
          onClick={addSocialLink}
          disabled={!canAddNewLink}
          className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
            canAddNewLink
              ? 'border-gray-300 hover:border-red-400 text-[#FF5B49]'
              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title={
            canAddNewLink
              ? 'Agregar nueva red social'
              : 'Completa todas las URLs anteriores para poder agregar más'
          }
        >
          <Plus size={16} />
          <span>Agregar red social</span>
        </button>
      </div>

      {/* Social Links List */}
      {localSocialLinks.map((link, index) => {
        const hasError = link.link && !isValidSocialMediaUrl(link.link);

        return (
          <div
            key={index}
            className='bg-white border border-gray-200 rounded-lg p-4'
          >
            <div className='flex justify-end -mt-2 -mr-2'>
              <button
                type='button'
                onClick={() => removeSocialLink(index)}
                className='inline-flex items-center justify-center p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors'
                title='Eliminar red social'
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                URL de la Red Social
              </label>
              <input
                type='url'
                value={link.link}
                onChange={e => updateSocialLink(index, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder='https://facebook.com/usuario'
              />
              {hasError && (
                <p className='mt-1 text-sm text-red-600'>
                  Debe ser una URL de perfil válida (ej:
                  https://facebook.com/usuario)
                </p>
              )}
              <p className='mt-1 text-xs text-gray-500'>
                Solo se permiten: Instagram, Facebook, Twitter, LinkedIn,
                YouTube, TikTok. Debe incluir el perfil de usuario.
              </p>
            </div>
          </div>
        );
      })}

      {/* Mostrar errores de validación */}
      {errors && (
        <p className='mt-1 text-sm text-red-600'>
          Debes completar todos los campos de redes sociales
        </p>
      )}
    </div>
  );
}
