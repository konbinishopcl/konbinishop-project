export function useImageUrl() {
  const media = useStrapiMedia('')

  const getImageUrl = (url: string | undefined): string => {
    if (!url) return ''

    // Si la URL ya es absoluta (empieza con http:// o https://), devolverla tal como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }

    // Si es relativa, concatenar con la base URL
    return media + url
  }

  return { getImageUrl }
}
