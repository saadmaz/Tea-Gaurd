import React, { createContext, useReducer, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  bootstrapped: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; token: string; user: User }
  | { type: 'LOGOUT' }
  | { type: 'BOOTSTRAP'; token: string | null; user: User | null };

const initial: AuthState = { token: null, user: null, bootstrapped: false };

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { token: action.token, user: action.user, bootstrapped: true };
    case 'LOGOUT':
      return { token: null, user: null, bootstrapped: true };
    case 'BOOTSTRAP':
      return { token: action.token, user: action.user, bootstrapped: true };
    default:
      return state;
  }
}

interface AuthContextValue {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextValue>({
  state: initial,
  dispatch: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const userJson = await AsyncStorage.getItem('auth_user');
        const user = userJson ? JSON.parse(userJson) : null;
        dispatch({ type: 'BOOTSTRAP', token, user });
      } catch {
        dispatch({ type: 'BOOTSTRAP', token: null, user: null });
      }
    })();
  }, []);

  useEffect(() => {
    if (!state.bootstrapped) return;
    if (state.token) {
      AsyncStorage.setItem('auth_token', state.token);
      AsyncStorage.setItem('auth_user', JSON.stringify(state.user));
    } else {
      AsyncStorage.removeItem('auth_token');
      AsyncStorage.removeItem('auth_user');
    }
  }, [state.token, state.bootstrapped]);

  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  return useContext(AuthContext);
}
