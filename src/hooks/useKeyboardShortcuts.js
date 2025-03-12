import { useEffect } from 'react';

/**
 * Custom hook for handling keyboard shortcuts
 *
 * This hook registers global keyboard shortcuts and runs the associated callbacks
 * when the shortcut is triggered.
 *
 * @param {Object} shortcuts - Object mapping keyboard shortcuts to callback functions
 * @param {Object} options - Options for configuring shortcut behavior
 * @param {boolean} options.enabled - Whether shortcuts are enabled
 * @param {Array<string>} options.excludedTargets - Array of element selectors to exclude
 * @returns {void}
 *
 * @example
 * // Usage example
 * useKeyboardShortcuts({
 *   'ctrl+enter': () => generateResponse(),
 *   'ctrl+c': () => copyToClipboard(),
 *   'escape': () => resetForm(),
 * });
 */
export const useKeyboardShortcuts = (
  shortcuts = {},
  { enabled = true, excludedTargets = ['input[type="text"]', 'textarea'] } = {}
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields or textareas
      if (
        excludedTargets.some((selector) => event.target.matches(selector)) &&
        !event.target.hasAttribute('data-shortcut-enabled')
      ) {
        return;
      }

      // Build shortcut string in format 'ctrl+shift+a'
      const shortcutPressed = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'meta', // Command key on Mac
        event.altKey && 'alt',
        event.shiftKey && 'shift',
        event.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      // Check if this shortcut is in our config
      if (shortcuts[shortcutPressed] && typeof shortcuts[shortcutPressed] === 'function') {
        event.preventDefault();
        shortcuts[shortcutPressed](event);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled, excludedTargets]);
};
