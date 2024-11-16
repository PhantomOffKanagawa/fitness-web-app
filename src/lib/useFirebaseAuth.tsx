import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase';

import {
  onAuthStateChanged as _onAuthStateChanged,
  User,
  signOut
} from "firebase/auth";

const formatAuthUser = (user: User) => ({
  uid: user.uid,
  email: user.email
});

export default function useFirebaseAuth() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const authStateChanged = async (authState: any) => {
    if (!authState) {
      setLoading(false)
      return;
    }

    setLoading(true)

    const formattedUser: any = formatAuthUser(authState);

    setAuthUser(formattedUser);

    setLoading(false);

  };

  const logout = () => {
    signOut(auth); // Sign out user from Firebase
    setAuthUser(null);
    setLoading(false);
  };


  const onAuthStateChanged = (cb: any) => {
     return _onAuthStateChanged(auth, cb);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authStateChanged);
    return () => unsubscribe();
  }, []);

  return {
    authUser,
    loading,
    logout,
  };
}