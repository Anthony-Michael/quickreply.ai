// src/lib/auth-helpers.js

// Store authentication token in localStorage
export const storeToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase.auth.token', token);
  }
};

// Retrieve authentication token from localStorage
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('supabase.auth.token');
  }
  return null;
};

// Remove authentication token from localStorage
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase.auth.token');
  }
};

// Get Authorization header with token
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Redirect to login page if not authenticated
export const redirectToLogin = () => {
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    window.location.href = '/login';
    return true;
  }
  return false;
};

// Redirect to dashboard if authenticated
export const redirectToDashboard = () => {
  if (typeof window !== 'undefined' && isAuthenticated()) {
    window.location.href = '/dashboard';
    return true;
  }
  return false;
}; 