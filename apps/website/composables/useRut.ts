export const useRut = () => {
  const cleanRut = (rut: string): string => {
    return rut.replace(/[^0-9kK-]/g, '').toUpperCase()
  }

  const validateRut = (rut: string): boolean => {
    if (!rut) return false

    const clean = cleanRut(rut)
    if (clean.length < 2) return false

    const [numbers, dv] = clean.split('-')
    if (!numbers || !dv) return false

    // Validar que el dígito verificador sea válido
    let sum = 0
    let multiplier = 2

    // Calcular la suma ponderada
    for (let i = numbers.length - 1; i >= 0; i--) {
      sum += parseInt(numbers[i]) * multiplier
      multiplier = multiplier === 7 ? 2 : multiplier + 1
    }

    // Calcular el dígito verificador esperado
    const expectedDv = 11 - (sum % 11)
    const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString()

    return calculatedDv === dv
  }

  const formatRut = (rut: string): string => {
    const clean = cleanRut(rut)
    if (clean.length < 2) return rut

    const [numbers, dv] = clean.split('-')
    if (!numbers || !dv) return rut

    // Formatear con puntos y guión
    const formattedNumbers = numbers
      .split('')
      .reverse()
      .join('')
      .replace(/(\d{3})/g, '$1.')
      .split('')
      .reverse()
      .join('')
      .replace(/^\./, '')

    return `${formattedNumbers}-${dv}`
  }

  return {
    cleanRut,
    validateRut,
    formatRut,
  }
}
