import Swal from 'sweetalert2';

// Configuración global de SweetAlert2
const swalConfig = {
  confirmButtonText: 'Entendido',
  cancelButtonText: 'Cancelar',
  timer: 2000,
  timerProgressBar: true,
  showConfirmButton: true,
  showCancelButton: false,
  allowOutsideClick: false,
  allowEscapeKey: true,
  customClass: {
    confirmButton: 'swal-confirm-button',
    cancelButton: 'swal-cancel-button',
  },
};

export const useSwal = () => {
  // Función para mostrar alertas de éxito
  const showSuccess = (
    title: string,
    text: string,
    options?: Partial<typeof swalConfig>
  ) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'success',
      title,
      text,
      ...options,
    });
  };

  // Función para mostrar alertas de error
  const showError = (
    title: string,
    text: string,
    options?: Partial<typeof swalConfig>
  ) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'error',
      title,
      text,
      timer: undefined, // Los errores no deben cerrarse automáticamente
      timerProgressBar: false,
      ...options,
    });
  };

  // Función para mostrar alertas de confirmación
  const showConfirm = (
    title: string,
    text: string,
    options?: Partial<typeof swalConfig>
  ) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      timer: undefined,
      timerProgressBar: false,
      ...options,
    });
  };

  // Función para mostrar alertas de información
  const showInfo = (
    title: string,
    text: string,
    options?: Partial<typeof swalConfig>
  ) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'info',
      title,
      text,
      timer: undefined,
      timerProgressBar: false,
      ...options,
    });
  };

  // Función para mostrar alertas de advertencia
  const showWarning = (
    title: string,
    text: string,
    options?: Partial<typeof swalConfig>
  ) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title,
      text,
      timer: undefined,
      timerProgressBar: false,
      ...options,
    });
  };

  return {
    showSuccess,
    showError,
    showConfirm,
    showInfo,
    showWarning,
  };
};
