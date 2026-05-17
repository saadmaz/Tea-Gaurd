import React, { createContext, useReducer } from 'react';

type EstateState = { estateId: string };
type EstateAction = Partial<EstateState>;

export const EstateContext = createContext({ state: { estateId: '' }, dispatch: (_: EstateAction) => {} });

export const EstateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer((s: EstateState, a: EstateAction): EstateState => ({ ...s, ...a }), { estateId: '' });
  return <EstateContext.Provider value={{ state, dispatch }}>{children}</EstateContext.Provider>;
};
