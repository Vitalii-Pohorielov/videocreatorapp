"use client";

import { useEffect, useState } from "react";

import { getCurrentUserPremiumStatus } from "@/lib/premiumAccess";
import { useAuthSession } from "@/lib/useAuthSession";

type PremiumStatusState = {
  isLoading: boolean;
  isPremium: boolean;
  error: string | null;
};

export function usePremiumStatus() {
  const { isLoading: isAuthLoading, user } = useAuthSession();
  const [state, setState] = useState<PremiumStatusState>({
    isLoading: true,
    isPremium: false,
    error: null,
  });

  useEffect(() => {
    let isActive = true;

    if (isAuthLoading) {
      setState((current) => ({ ...current, isLoading: true }));
      return () => {
        isActive = false;
      };
    }

    if (!user) {
      setState({
        isLoading: false,
        isPremium: false,
        error: null,
      });
      return () => {
        isActive = false;
      };
    }

    setState({
      isLoading: true,
      isPremium: false,
      error: null,
    });

    getCurrentUserPremiumStatus()
      .then((isPremium) => {
        if (!isActive) return;
        setState({
          isLoading: false,
          isPremium,
          error: null,
        });
      })
      .catch((error) => {
        if (!isActive) return;
        setState({
          isLoading: false,
          isPremium: false,
          error: error instanceof Error ? error.message : "Could not verify premium access.",
        });
      });

    return () => {
      isActive = false;
    };
  }, [isAuthLoading, user]);

  return state;
}
