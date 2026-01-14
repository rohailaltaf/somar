"use client";

import { useAuth } from "@/providers";
import { authFormStyles } from "@somar/shared/styles";

export default function WaitlistPage() {
  const { session, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className={authFormStyles.loading.container}>
        <div className={authFormStyles.loading.spinner} />
      </div>
    );
  }

  return (
    <div className={authFormStyles.card}>
      <div className={authFormStyles.header.container}>
        <h1 className={authFormStyles.header.title}>You're on the list</h1>
        <p className={authFormStyles.header.subtitle}>
          We'll let you know when your account is approved
        </p>
      </div>

      <div className={authFormStyles.waitlist.emailBox}>
        <p className={authFormStyles.waitlist.emailLabel}>Signed in as</p>
        <p className={authFormStyles.waitlist.emailValue}>{session?.user?.email}</p>
      </div>

      <p className={authFormStyles.waitlist.description}>
        You'll receive an email at this address once you're approved. This usually happens within 24 hours.
      </p>

      <button
        type="button"
        onClick={logout}
        className={authFormStyles.button.ghost}
      >
        <span className={authFormStyles.button.ghostText}>Sign out</span>
      </button>
    </div>
  );
}
