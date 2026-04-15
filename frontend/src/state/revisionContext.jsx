import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth.jsx';
import { adminApi } from '../services/adminApi';

const RevisionContext = createContext(null);

export function RevisionProvider({ children }) {
  const { token } = useAuth();
  const [reportesAbiertos, setReportesAbiertos] = useState(0);

  const refresh = () => {
    if (!token) return;
    adminApi
      .listReportes(token, { page: 1, page_size: 1, estado: 'abierto' })
      .then((res) => { if (res) setReportesAbiertos(res.pagination?.total ?? 0); })
      .catch(() => {});
  };

  useEffect(() => { refresh(); }, [token]);

  return (
    <RevisionContext.Provider value={{ reportesAbiertos, setReportesAbiertos, refresh }}>
      {children}
    </RevisionContext.Provider>
  );
}

export function useRevision() {
  return useContext(RevisionContext);
}
