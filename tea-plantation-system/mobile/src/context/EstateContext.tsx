import React, { createContext, useReducer } from 'react';

export const EstateContext = createContext({ state: { estateId: '' }, dispatch: (_: any) => {} });

export const EstateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer((s: any, a: any) => ({ ...s, ...a }), { estateId: '' });
  return <EstateContext.Provider value={{ state, dispatch }}>{children}</EstateContext.Provider>;
};
