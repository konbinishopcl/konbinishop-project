'use client';

import { buildStrapiImageUrl } from '@/lib/helpers';
import { StrapiAPI } from '@/lib/strapi';
import { Plus, Upload, X } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

interface ImageUploadFieldProps {
  name: string;
  label: string;
  multiple?: boolean;
  required?: boolean;
  errors?: {
    message?: string;
  };
}

interface UploadedImage {
  id: number;
  url: string;
  name: string;
}

export default function ImageUploadField({
  name,
  label,
  multiple = false,
  required = false,
  errors,
}: ImageUploadFieldProps) {
  const { register, setValue, watch } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const currentValue = watch(name);

  // Función para convertir imágenes de Strapi al formato esperado
  const normalizeStrapiImage = (image: unknown): UploadedImage | null => {
    if (!image || typeof image !== 'object') {
      return null;
    }

    const imageObj = image as Record<string, unknown>;

    // Caso 1: Imagen recién subida (tiene url directa)
    if (typeof imageObj.url === 'string' && imageObj.url.startsWith('http')) {
      return {
        id: typeof imageObj.id === 'number' ? imageObj.id : 0,
        url: imageObj.url,
        name: typeof imageObj.name === 'string' ? imageObj.name : '',
      };
    }

    // Caso 2: Imagen de Strapi (tiene formats, thumbnail, etc.)
    // Usar el helper para construir la URL a través del proxy (solo formato y calidad)
    const imageUrl = buildStrapiImageUrl(imageObj as Record<string, unknown>, {
      format: 'webp',
      quality: 80,
    });

    return {
      id: typeof imageObj.id === 'number' ? imageObj.id : 0,
      url: imageUrl,
      name: typeof imageObj.name === 'string' ? imageObj.name : '',
    };
  };

  const images = multiple
    ? (currentValue || []).map(normalizeStrapiImage).filter(Boolean)
    : (currentValue ? [normalizeStrapiImage(currentValue)] : []).filter(
        Boolean
      );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = Array.from(files).map(async file => {
        const response = await StrapiAPI.uploadFile(file);
        const uploadedFile = response[0];

        // Construir la URL usando el helper (solo formato y calidad)
        const imageUrl = buildStrapiImageUrl({
          url: uploadedFile.url,
          formats: uploadedFile.formats,
        });

        return {
          id: uploadedFile.id,
          url: imageUrl,
          name: uploadedFile.name,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      if (multiple) {
        // Para galería: agregar a la lista existente
        const existingImages = currentValue || [];
        setValue(name, [...existingImages, ...uploadedImages]);
      } else {
        // Para imagen única: reemplazar
        setValue(name, uploadedImages[0]);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async (imageId: number) => {
    try {
      // Eliminar archivo del servidor
      await StrapiAPI.deleteFile(imageId);

      // Actualizar estado local
      if (multiple) {
        const updatedImages = images.filter(
          (img: UploadedImage) => img.id !== imageId
        );
        setValue(name, updatedImages);
      } else {
        setValue(name, null);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadError('Error al eliminar la imagen del servidor');
    }
  };

  const removeImageByIndex = async (index: number) => {
    try {
      const imageToRemove = images[index];

      // Eliminar archivo del servidor
      await StrapiAPI.deleteFile(imageToRemove.id);

      // Actualizar estado local
      if (multiple) {
        const updatedImages = images.filter(
          (_: UploadedImage, i: number) => i !== index
        );
        setValue(name, updatedImages);
      } else {
        setValue(name, null);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadError('Error al eliminar la imagen del servidor');
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <label className='block text-sm font-medium text-gray-700'>
          {label} {required && <span className='text-red-500'>*</span>}
        </label>
      </div>

      {/* Upload Area with Image Preview */}
      <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors'>
        {images && images.length > 0 ? (
          // Show uploaded images inside the upload area
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='text-sm font-medium text-gray-700'>
                {multiple ? 'Imágenes subidas:' : 'Imagen subida:'}
              </h4>
              <input
                type='file'
                multiple={multiple}
                accept='image/*'
                onChange={handleFileUpload}
                className='hidden'
                id={`${name}-upload`}
                disabled={isUploading}
              />
              <label
                htmlFor={`${name}-upload`}
                className='cursor-pointer inline-flex items-center px-3 py-1 bg-[var(--brand-primary)] text-white text-xs font-medium rounded hover:bg-[var(--brand-primary)]/80 transition-colors'
              >
                <Plus size={14} className='mr-1' />
                {multiple ? 'Agregar más' : 'Cambiar'}
              </label>
            </div>

            <div className='flex flex-wrap gap-4'>
              {images.map((image: UploadedImage, index: number) => (
                <div key={image.id} className='flex-shrink-0'>
                  <div className='w-50 h-50 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative'>
                    {}
                    <Image
                      src={image.url}
                      alt={image.name}
                      width={200}
                      height={200}
                      className='w-full h-full object-cover'
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <button
                      type='button'
                      onClick={async () => {
                        setIsDeleting(image.id);
                        try {
                          if (multiple) {
                            await removeImageByIndex(index);
                          } else {
                            await removeImage(image.id);
                          }
                        } finally {
                          setIsDeleting(null);
                        }
                      }}
                      disabled={isDeleting === image.id}
                      className='absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors shadow-sm z-10 disabled:opacity-50 disabled:cursor-not-allowed'
                      title='Eliminar imagen'
                    >
                      {isDeleting === image.id ? (
                        <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      ) : (
                        <X size={12} />
                      )}
                    </button>
                  </div>
                  <p
                    className='mt-1 text-xs text-gray-600 truncate text-center w-50'
                    title={image.name}
                  >
                    {image.name.length > 20
                      ? `${image.name.substring(0, 20)}...`
                      : image.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Show upload interface when no images
          <div className='text-center'>
            <input
              type='file'
              multiple={multiple}
              accept='image/*'
              onChange={handleFileUpload}
              className='hidden'
              id={`${name}-upload`}
              disabled={isUploading}
            />
            <label
              htmlFor={`${name}-upload`}
              className='cursor-pointer flex flex-col items-center space-y-2'
            >
              <Upload size={24} className='text-gray-400' />
              <div className='text-sm text-gray-600'>
                {isUploading ? (
                  <span className='text-[var(--brand-primary)]'>
                    Subiendo imagen...
                  </span>
                ) : (
                  <>
                    <span className='font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80'>
                      Haz clic para subir
                    </span>
                    {multiple ? ' imágenes' : ' una imagen'}
                  </>
                )}
              </div>
              <p className='text-xs text-gray-500'>PNG, JPG, GIF hasta 10MB</p>
            </label>
          </div>
        )}
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-sm text-red-600'>{uploadError}</p>
        </div>
      )}

      {/* Mostrar errores de validación */}
      {errors && (
        <p className='mt-1 text-sm text-red-600'>
          {errors.message || `${label} es requerido`}
        </p>
      )}

      {/* Hidden input for form validation */}
      <input
        type='hidden'
        {...register(name, {
          required: required ? `${label} es requerido` : false,
        })}
      />
    </div>
  );
}
