import { createContext, useContext, useState } from 'react';

const RevisionContext = createContext(null);

export function RevisionProvider({ children }) {
  const [pendientes, setPendientes] = useState(0);
  return (
    <RevisionContext.Provider value={{ pendientes, setPendientes }}>
      {children}
    </RevisionContext.Provider>
  );
}

export function useRevision() {
  return useContext(RevisionContext);
}
