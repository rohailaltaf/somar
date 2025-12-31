"use client";

import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-client";

/**
 * Dedicated signout page that handles logout without loading auth context.
 * This avoids race conditions with the AuthProvider.
 */
export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(true);

  useEffect(() => {
    async function handleSignOut() {
      try {
        // Clear encryption key from sessionStorage
        sessionStorage.removeItem("somar_encryption_key");
        
        // Sign out from Better Auth
        await signOut();
      } catch (error) {
        console.error("Sign out error:", error);
      } finally {
        // Always redirect to login, even on error
        window.location.href = "/login";
      }
    }

    handleSignOut();
  }, []);

  if (!isSigningOut) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-semibold text-white">Signing out...</h2>
        <p className="text-slate-400">Please wait</p>
      </div>
    </div>
  );
}
