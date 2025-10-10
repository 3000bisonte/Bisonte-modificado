import { useState, useCallback } from "react";

/**
 * Hook personalizado para manejar modales de notificación
 * 
 * @returns {Object} - Objeto con el estado del modal y funciones para controlarlo
 * @returns {Object} modalState - Estado actual del modal
 * @returns {Function} showModal - Función para mostrar el modal
 * @returns {Function} closeModal - Función para cerrar el modal
 * @returns {Function} showSuccess - Atajo para mostrar modal de éxito
 * @returns {Function} showError - Atajo para mostrar modal de error
 * @returns {Function} showWarning - Atajo para mostrar modal de advertencia
 * @returns {Function} showInfo - Atajo para mostrar modal de información
 * 
 * @example
 * const { modalState, showSuccess, showError, closeModal } = useNotification();
 * 
 * // Mostrar éxito
 * showSuccess('¡Éxito!', 'Operación completada correctamente');
 * 
 * // Mostrar error con detalles
 * showError('Error', 'No se pudo guardar', 'Error 500: Internal Server Error');
 * 
 * // En el JSX
 * <NotificationModal {...modalState} onClose={closeModal} />
 */
export function useNotification() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    details: null,
  });

  const showModal = useCallback((type, title, message, details = null) => {
    setModalState({
      isOpen: true,
      type,
      title,
      message,
      details,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Atajos para cada tipo de notificación
  const showSuccess = useCallback((title, message, details = null) => {
    showModal('success', title, message, details);
  }, [showModal]);

  const showError = useCallback((title, message, details = null) => {
    showModal('error', title, message, details);
  }, [showModal]);

  const showWarning = useCallback((title, message, details = null) => {
    showModal('warning', title, message, details);
  }, [showModal]);

  const showInfo = useCallback((title, message, details = null) => {
    showModal('info', title, message, details);
  }, [showModal]);

  return {
    modalState,
    showModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
