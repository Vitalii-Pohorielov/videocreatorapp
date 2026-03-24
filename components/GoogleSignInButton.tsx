"use client";

import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";

type GoogleSignInButtonProps = {
  redirectPath?: string;
  className?: string;
  label?: string;
};

export function GoogleSignInButton({
  redirectPath = "/projects",
  className = "",
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsBusy(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}${redirectPath}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Could not start Google sign-in.";
      setError(message);
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isBusy}
        className={className}
      >
        {isBusy ? "Redirecting..." : label}
      </button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
