const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('milkledger_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const text = await response.text();
  
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { msg: text || 'API Response parse error' };
  }

  if (!response.ok) {
    // If unauthorized, clear token and redirect (optional, but clean)
    if (response.status === 401) {
      localStorage.removeItem('milkledger_token');
      // optional redirect if window is defined
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login?session_expired=true';
      }
    }
    throw new Error(data.msg || 'Network response was not ok');
  }

  return data;
};

export default apiClient;
export { API_URL };
