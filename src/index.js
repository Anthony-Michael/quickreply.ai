import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';

// Error boundary component for handling lazy loading errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='max-w-md p-6 bg-white rounded-lg shadow-md'>
            <h2 className='text-xl font-bold text-red-600 mb-4'>Something went wrong</h2>
            <p className='text-gray-700 mb-4'>
              We&apos;re sorry, but an error occurred while loading this page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global fallback component for suspense
const GlobalLoadingFallback = () => (
  <div className='min-h-screen flex items-center justify-center bg-gray-50'>
    <div className='flex flex-col items-center'>
      <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4'></div>
      <p className='text-lg text-gray-700'>Loading QuickReply.ai...</p>
    </div>
  </div>
);

if (typeof window !== 'undefined') {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<GlobalLoadingFallback />}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
