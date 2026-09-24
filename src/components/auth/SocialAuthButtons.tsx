"use client";

import { useEffect, useRef, useState } from "react";

const buttonClasses =
  "inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-surface text-sm font-semibold text-ink transition-colors hover:border-navy-300 hover:bg-surface-alt";

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        use_fedcm_for_prompt?: boolean;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (element: HTMLElement, options: {
        type: "standard";
        theme: "outline";
        size: "large";
        text: "signin_with" | "signup_with";
        shape: "rectangular";
        width: number;
      }) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let googleScriptPromise: Promise<void> | null = null;
let googleInitializedClientId = "";
let googleCredentialHandler: ((idToken: string) => void) | undefined;
let googleErrorHandler: ((message: string) => void) | undefined;

function loadGoogleScript() {
  if (window.google) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google sign-in."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export function SocialAuthButtons({
  label = "continue",
  onGoogle,
  onGoogleError,
}: {
  label?: string;
  onGoogle?: (idToken: string) => void;
  onGoogleError?: (message: string) => void;
}) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    googleCredentialHandler = onGoogle;
    googleErrorHandler = onGoogleError;
    return () => {
      googleCredentialHandler = undefined;
      googleErrorHandler = undefined;
    };
  }, [onGoogle, onGoogleError]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!clientId) {
      googleErrorHandler?.("Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env.local.");
      return;
    }

    loadGoogleScript()
      .then(() => {
        if (!window.google) return;
        if (!googleInitializedClientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            use_fedcm_for_prompt: true,
            callback: ({ credential }) => googleCredentialHandler?.(credential),
          });
          googleInitializedClientId = clientId;
        }
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: label === "Sign up" ? "signup_with" : "signin_with",
            shape: "rectangular",
            width: 400,
          });
        }
        setGoogleReady(true);
      })
      .catch(() => {
        setGoogleReady(false);
        googleErrorHandler?.("Could not load Google sign-in. Check your connection and try again.");
      });
  // The Google loader must run once per mounted auth surface. The callback is
  // stable in AuthForm, and keeping this dependency list empty also prevents
  // Fast Refresh from changing the hook signature during development.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={googleButtonRef}
        className="flex min-h-12 w-full items-center justify-center overflow-hidden"
        aria-label={googleReady ? "Continue with Google" : "Loading Google sign-in"}
      />
      <button type="button" className={buttonClasses}>
        <AppleIcon />
        {label === "continue" ? "Continue with Apple" : `${label} with Apple`}
      </button>
    </div>
  );
}

export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 384 512" aria-hidden fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}
