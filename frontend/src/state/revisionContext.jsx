import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth.jsx';
import { adminApi } from '../services/adminApi';
import { profesorApi } from '../services/profesorApi';

const RevisionContext = createContext(null);

export function RevisionProvider({ children }) {
  const { token, user } = useAuth();
  const [reportesAbiertos, setReportesAbiertos] = useState(0);

  const refresh = () => {
    if (!token || !['admin', 'profesor'].includes(user?.role)) {
      setReportesAbiertos(0);
      return;
    }
    const api = user.role === 'profesor' ? profesorApi : adminApi;
    api
      .listReportes(token, { page: 1, page_size: 1, estado: 'abierto' })
      .then((res) => { if (res) setReportesAbiertos(res.pagination?.total ?? 0); })
      .catch(() => {});
  };

  useEffect(() => { refresh(); }, [token, user?.role]);

  return (
    <RevisionContext.Provider value={{ reportesAbiertos, setReportesAbiertos, refresh }}>
      {children}
    </RevisionContext.Provider>
  );
}

export function useRevision() {
  return useContext(RevisionContext);
}
