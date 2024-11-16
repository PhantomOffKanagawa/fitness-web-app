"use client";

import React, { createContext, useContext} from 'react'
import useFirebaseAuth from '@/lib/useFirebaseAuth';
import { User } from 'firebase/auth';

const authContext = createContext({
  authUser: null,
  loading: true,
  logout: () => {},
});

import { ReactNode } from 'react';

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

// custom hook to use the authUserContext and access authUser and loading
export const useAuth = () => useContext(authContext);
export type { User };