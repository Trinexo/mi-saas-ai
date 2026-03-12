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

const parseResponsePayload = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return { message: 'Respuesta JSON inválida del servidor' };
    }
  }

  return { message: rawBody };
};

export const getErrorMessage = (error, fallback = 'Ha ocurrido un error inesperado') => {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
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

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(payload?.message || 'Error de API');
  }

  return payload?.data ?? null;
}