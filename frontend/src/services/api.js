const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const buildUrl = (path, query) => {
  if (!query) {
    return `${API_URL}${path}`;
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return `${API_URL}${path}${queryString ? `?${queryString}` : ''}`;
};

export async function apiRequest(path, { method = 'GET', body, token, query } = {}) {
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || 'Error de API');
  }

  return payload.data;
}