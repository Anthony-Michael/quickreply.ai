/**
 * Utility for tracking lazy loaded component performance
 */

// Store component load times
const componentLoadTimes = {};

/**
 * Track when a component starts loading
 * @param {string} componentName - The name of the component
 */
export const trackComponentLoadStart = (componentName) => {
  if (!componentName) return;

  componentLoadTimes[componentName] = {
    startTime: performance.now(),
    loaded: false,
  };

  console.debug(`[LazyLoad] Started loading: ${componentName}`);
};

/**
 * Track when a component finishes loading
 * @param {string} componentName - The name of the component
 */
export const trackComponentLoadEnd = (componentName) => {
  if (!componentName || !componentLoadTimes[componentName]) return;

  const { startTime } = componentLoadTimes[componentName];
  const loadTime = performance.now() - startTime;

  componentLoadTimes[componentName] = {
    ...componentLoadTimes[componentName],
    loadTime,
    loaded: true,
    endTime: performance.now(),
  };

  console.debug(`[LazyLoad] Finished loading: ${componentName} (${loadTime.toFixed(2)}ms)`);

  // Send to analytics if available
  try {
    if (window.gtag) {
      window.gtag('event', 'component_lazy_loaded', {
        component_name: componentName,
        load_time_ms: loadTime,
      });
    }
  } catch (error) {
    console.error('Error sending lazy load analytics', error);
  }
};

/**
 * Wrap a lazy loaded import to track performance
 * @param {function} importFn - The import function
 * @param {string} componentName - The name of the component
 * @returns {Promise} The component import promise
 */
export const trackedLazyImport = (importFn, componentName) => {
  trackComponentLoadStart(componentName);

  return importFn().then((module) => {
    trackComponentLoadEnd(componentName);
    return module;
  });
};

/**
 * Get a summary of all component load times
 * @returns {Object} Component load time summary
 */
export const getComponentLoadSummary = () => {
  return Object.entries(componentLoadTimes).reduce((summary, [name, data]) => {
    summary[name] = {
      loaded: data.loaded,
      loadTime: data.loadTime ? `${data.loadTime.toFixed(2)}ms` : 'Not loaded',
    };
    return summary;
  }, {});
};
