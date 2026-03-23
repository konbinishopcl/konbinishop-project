'use client';

import { Plus, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EventVideosFieldProps {
  videos?: Array<{ link: string }>;
  onVideosChange: (videos: Array<{ link: string }>) => void;
  errors?: Array<{
    link?: { message: string };
  }>;
}

export default function EventVideosField({
  videos = [],
  onVideosChange,
  errors,
}: EventVideosFieldProps) {
  const [localVideos, setLocalVideos] =
    useState<Array<{ link: string }>>(videos);

  // Sincronizar con el prop videos
  useEffect(() => {
    setLocalVideos(videos);
  }, [videos]);

  // Función única para actualizar videos
  const updateVideos = (newVideos: Array<{ link: string }>) => {
    setLocalVideos(newVideos);
    onVideosChange(newVideos);
  };

  // Función para validar que la URL sea de YouTube
  const isValidYouTubeUrl = (url: string): boolean => {
    if (!url.trim()) return false;

    const youtubePatterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/i,
      /^https?:\/\/(www\.)?youtu\.be\/[a-zA-Z0-9_-]+/i,
    ];

    return youtubePatterns.some(pattern => pattern.test(url));
  };

  // Verificar si se puede agregar un nuevo video (todos los campos anteriores deben estar completos y válidos)
  const canAddNewVideo =
    localVideos.length === 0 ||
    localVideos.every(video => video.link && isValidYouTubeUrl(video.link));

  const addVideo = () => {
    if (canAddNewVideo) {
      updateVideos([...localVideos, { link: '' }]);
    }
  };

  const removeVideo = (index: number) => {
    updateVideos(localVideos.filter((_, i) => i !== index));
  };

  const updateVideo = (index: number, url: string) => {
    const newVideos = [...localVideos];
    newVideos[index] = { ...newVideos[index], link: url };
    updateVideos(newVideos);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col space-y-1'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center'>
            <Video size={20} className='mr-2 text-[var(--brand-primary)]' />
            Videos
          </h3>
          <p className='text-sm text-gray-600'>
            Agrega enlaces a videos de YouTube del evento
          </p>
        </div>

        <button
          type='button'
          onClick={addVideo}
          disabled={!canAddNewVideo}
          className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
            canAddNewVideo
              ? 'border-gray-300 hover:border-red-400 text-[#FF5B49]'
              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title={
            canAddNewVideo
              ? 'Agregar nuevo video'
              : 'Completa todos los videos anteriores para poder agregar más'
          }
        >
          <Plus size={16} />
          <span>Agregar video</span>
        </button>
      </div>

      {/* Videos List */}
      {localVideos.map((video, index) => {
        const hasError = video.link && !isValidYouTubeUrl(video.link);

        return (
          <div
            key={index}
            className='bg-white border border-gray-200 rounded-lg p-4'
          >
            <div className='flex justify-end -mt-2 -mr-2'>
              <button
                type='button'
                onClick={() => removeVideo(index)}
                className='inline-flex items-center justify-center p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors'
                title='Eliminar video'
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                URL del Video
              </label>
              <input
                type='url'
                value={video.link}
                onChange={e => updateVideo(index, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder='https://youtube.com/watch?v=... o https://youtu.be/...'
              />
              {hasError && (
                <p className='mt-1 text-sm text-red-600'>
                  Debe ser una URL de video de YouTube válida
                </p>
              )}
              <p className='mt-1 text-xs text-gray-500'>
                Solo se permiten videos de YouTube. Usa el enlace completo del
                video.
              </p>
            </div>
          </div>
        );
      })}

      {/* Mostrar errores de validación */}
      {errors && (
        <p className='mt-1 text-sm text-red-600'>
          Debes completar todos los campos de videos
        </p>
      )}
    </div>
  );
}
