import React, { createContext, useReducer } from 'react';

type State = { token: string | null };
const initial: State = { token: null };

export const AuthContext = createContext({ state: initial, dispatch: (_: any) => {} });

function reducer(state: State, action: any): State {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    default:
      return state;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial);
  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>;
};
