"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase";

type AuthSessionState = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
};

export function useAuthSession() {
  const [state, setState] = useState<AuthSessionState>({
    isLoading: true,
    session: null,
    user: null,
    error: null,
  });

  useEffect(() => {
    let isActive = true;
    let unsubscribe = () => undefined;

    try {
      const supabase = getSupabaseBrowserClient();

      supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (!isActive) return;

          if (error) {
            setState({
              isLoading: false,
              session: null,
              user: null,
              error: error.message,
            });
            return;
          }

          setState({
            isLoading: false,
            session: data.session,
            user: data.session?.user ?? null,
            error: null,
          });
        })
        .catch((sessionError) => {
          if (!isActive) return;
          setState({
            isLoading: false,
            session: null,
            user: null,
            error: sessionError instanceof Error ? sessionError.message : "Could not load session.",
          });
        });

      const authListener = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isActive) return;
        setState({
          isLoading: false,
          session,
          user: session?.user ?? null,
          error: null,
        });
      });

      unsubscribe = () => {
        authListener.data.subscription.unsubscribe();
      };
    } catch (sessionError) {
      if (!isActive) return;
      setState({
        isLoading: false,
        session: null,
        user: null,
        error: sessionError instanceof Error ? sessionError.message : "Could not initialize authentication.",
      });
    }

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  return state;
}
