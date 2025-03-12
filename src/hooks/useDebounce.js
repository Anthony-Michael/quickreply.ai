import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing a value
 * 
 * This hook helps improve performance by delaying the update of a value
 * until a specified delay has passed since the last change.
 * Useful for input fields, search queries, and other scenarios where
 * frequent updates might cause performance issues.
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {any} The debounced value
 */
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear the timeout if the value changes before the delay has passed
    // or if the component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce; 