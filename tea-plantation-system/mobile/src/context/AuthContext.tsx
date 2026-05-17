import React, { createContext, useReducer } from 'react';

type State = { token: string | null };
type Action = { type: 'SET_TOKEN'; payload: string | null };
const initial: State = { token: null };

export const AuthContext = createContext({ state: initial, dispatch: (_: Action) => {} });

function reducer(state: State, action: Action): State {
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
