import { useEffect, useState } from 'react';

interface UseSlugifyOptions {
  title: string;
  isEditing?: boolean;
  initialSlug?: string;
  delay?: number;
}

// Función propia para generar slugs
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (tildes, diéresis, etc.)
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/-+/g, '-') // Elimina guiones múltiples
    .trim(); // Elimina espacios al inicio y final
}

export function useSlugify({
  title,
  isEditing = false,
  initialSlug = '',
  delay = 300,
}: UseSlugifyOptions) {
  const [slug, setSlug] = useState(initialSlug);
  const [debouncedTitle, setDebouncedTitle] = useState(title);

  // Debounce the title to avoid generating slug on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitle(title);
    }, delay);

    return () => clearTimeout(timer);
  }, [title, delay]);

  // Generate slug from debounced title
  useEffect(() => {
    if (debouncedTitle.trim()) {
      const generatedSlug = generateSlug(debouncedTitle);
      setSlug(generatedSlug);
    }
  }, [debouncedTitle]);

  // Set initial slug when editing
  useEffect(() => {
    if (isEditing && initialSlug) {
      setSlug(initialSlug);
    }
  }, [isEditing, initialSlug]);

  return {
    slug,
    setSlug,
    isGenerating: debouncedTitle !== title,
  };
}
