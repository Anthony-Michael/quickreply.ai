import React, { useState, useEffect } from 'react';
import { getComponentLoadSummary } from '../lib/lazyLoadAnalytics';

const DevLazyLoadStats = () => {
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState({});
  const [isDev] = useState(
    process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  );

  useEffect(() => {
    // Only enable in development mode
    if (!isDev) return;

    // Add a key binding to toggle visibility (Ctrl+Shift+L)
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        setVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Set up interval to update stats
    const interval = setInterval(() => {
      setStats(getComponentLoadSummary());
    }, 500);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, [isDev]);

  // Don't render anything in production
  if (!isDev || !visible) return null;

  return (
    <div className='fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 w-80 max-h-80 overflow-auto'>
      <div className='flex justify-between items-center mb-2'>
        <h3 className='font-bold text-gray-700'>Lazy Load Performance</h3>
        <button onClick={() => setVisible(false)} className='text-gray-500 hover:text-gray-800'>
          ✕
        </button>
      </div>

      <div className='text-xs text-gray-500 mb-2'>Press Ctrl+Shift+L to toggle this panel</div>

      <table className='w-full text-sm'>
        <thead>
          <tr>
            <th className='text-left border-b pb-1'>Component</th>
            <th className='text-left border-b pb-1'>Status</th>
            <th className='text-right border-b pb-1'>Load Time</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats).map(([name, data]) => (
            <tr key={name}>
              <td className='py-1'>{name}</td>
              <td className='py-1'>
                <span
                  className={`inline-block w-2 h-2 rounded-full ${data.loaded ? 'bg-green-500' : 'bg-yellow-500'} mr-1`}
                ></span>
                {data.loaded ? 'Loaded' : 'Loading'}
              </td>
              <td className='text-right py-1'>{data.loadTime}</td>
            </tr>
          ))}
          {Object.keys(stats).length === 0 && (
            <tr>
              <td colSpan={3} className='text-center py-4 text-gray-500'>
                No components loaded yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DevLazyLoadStats;
