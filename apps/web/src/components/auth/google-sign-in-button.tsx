"use client";

import { useEffect, useRef, useCallback } from "react";

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (
    element: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
    }
  ) => void;
  prompt: () => void;
}

interface GoogleAccounts {
  accounts: {
    id: GoogleAccountsId;
  };
}

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      if (response.credential) {
        onSuccess(response.credential);
      } else {
        onError?.(new Error("No credential received from Google"));
      }
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
      return;
    }

    // Load the Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    const renderButton = () => {
      const google = (window as unknown as { google?: GoogleAccounts }).google;
      if (!google || !buttonRef.current) return;

      // Clear any existing button
      buttonRef.current.innerHTML = "";
      isInitialized.current = true;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        itp_support: true,
      });

      // Get the container width for responsive sizing
      const containerWidth = buttonRef.current.offsetWidth;

      google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: containerWidth,
      });
    };

    script.onload = renderButton;

    script.onerror = () => {
      onError?.(new Error("Failed to load Google Sign-In script"));
    };

    document.head.appendChild(script);

    // Re-render on resize
    const handleResize = () => {
      if (isInitialized.current) {
        renderButton();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript) {
        existingScript.remove();
      }
      isInitialized.current = false;
    };
  }, [handleCredentialResponse, onError]);

  return (
    <div
      ref={buttonRef}
      className={`w-full ${disabled ? "pointer-events-none opacity-50" : ""}`}
    />
  );
}
