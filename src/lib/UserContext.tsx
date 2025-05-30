"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "./supabaseClient";

interface User {
  id: string;
  email: string | null | undefined;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({ user: null, loading: true });

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email });
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
