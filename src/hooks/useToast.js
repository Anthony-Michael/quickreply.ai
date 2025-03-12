import { useState } from 'react';

/**
 * A simple hook for managing toast notifications
 * @returns {Object} Toast state and functions
 */
export const useToast = () => {
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success', // 'success', 'error', 'info'
    duration: 3000,
  });

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of toast (success, error, info)
   * @param {number} duration - How long to show the toast in ms
   */
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({
      show: true,
      message,
      type,
      duration,
    });

    // Auto-hide the toast after the specified duration
    setTimeout(() => {
      hideToast();
    }, duration);
  };

  /**
   * Hide the currently displayed toast
   */
  const hideToast = () => {
    setToast((prev) => ({
      ...prev,
      show: false,
    }));
  };

  return {
    toast,
    showToast,
    hideToast,
  };
};
