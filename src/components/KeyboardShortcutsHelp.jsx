import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display available keyboard shortcuts to users
 *
 * @param {Object} props
 * @param {Array<{keys: string, description: string, category: string}>} props.shortcuts - Array of shortcut objects
 * @returns {JSX.Element}
 */
const KeyboardShortcutsHelp = ({ shortcuts = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {});

  // Format key combinations for display
  const formatKeys = (keys) => {
    return keys
      .split('+')
      .map((key) => key.charAt(0).toUpperCase() + key.slice(1))
      .map((key) => {
        switch (key) {
          case 'Ctrl':
            return (
              <kbd
                key={key}
                className='px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded'
              >
                Ctrl
              </kbd>
            );
          case 'Meta':
            return (
              <kbd
                key={key}
                className='px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded'
              >
                ⌘
              </kbd>
            );
          case 'Alt':
            return (
              <kbd
                key={key}
                className='px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded'
              >
                Alt
              </kbd>
            );
          case 'Shift':
            return (
              <kbd
                key={key}
                className='px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded'
              >
                Shift
              </kbd>
            );
          case 'Enter':
            return (
              <kbd
                key={key}
                className='px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded'
              >
                Enter
              </kbd>
            );
          case 'Escape':
            return (
              <kbd
                key={key}
                className='px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded'
              >
                Esc
              </kbd>
            );
          default:
            return (
              <kbd
                key={key}
                className='px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded'
              >
                {key}
              </kbd>
            );
        }
      })
      .reduce((acc, key, i) => {
        return i === 0
          ? [key]
          : [
              ...acc,
              <span key={`sep-${i}`} className='mx-1'>
                +
              </span>,
              key,
            ];
      }, []);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        type='button'
        className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup='dialog'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-5 w-5 mr-2'
          viewBox='0 0 20 20'
          fill='currentColor'
        >
          <path
            fillRule='evenodd'
            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
            clipRule='evenodd'
          />
        </svg>
        Keyboard Shortcuts
      </button>

      {/* Modal dialog */}
      {isOpen && (
        <div
          className='fixed z-10 inset-0 overflow-y-auto'
          role='dialog'
          aria-modal='true'
          aria-labelledby='keyboard-shortcuts-title'
        >
          <div className='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            {/* Background overlay */}
            <div
              className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
              aria-hidden='true'
              onClick={() => setIsOpen(false)}
            ></div>

            {/* Modal panel */}
            <div className='inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6'>
              <div>
                <div className='mt-3 text-center sm:mt-0 sm:text-left'>
                  <h3
                    className='text-lg leading-6 font-medium text-gray-900'
                    id='keyboard-shortcuts-title'
                  >
                    Keyboard Shortcuts
                  </h3>
                  <div className='mt-4'>
                    {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
                      <div key={category} className='mb-6'>
                        <h4 className='text-sm font-medium text-gray-700 mb-2'>{category}</h4>
                        <div className='space-y-3'>
                          {categoryShortcuts.map((shortcut, index) => (
                            <div key={index} className='flex justify-between items-center'>
                              <span className='text-sm text-gray-600'>{shortcut.description}</span>
                              <div className='flex items-center space-x-1'>
                                {formatKeys(shortcut.keys)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className='mt-5 sm:mt-6'>
                <button
                  type='button'
                  className='inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm'
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

KeyboardShortcutsHelp.propTypes = {
  shortcuts: PropTypes.arrayOf(
    PropTypes.shape({
      keys: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      category: PropTypes.string,
    })
  ),
};

KeyboardShortcutsHelp.defaultProps = {
  shortcuts: [],
};

export default KeyboardShortcutsHelp;
