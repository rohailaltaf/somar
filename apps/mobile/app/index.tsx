/**
 * Root index - renders nothing.
 * AuthGuard in _layout.tsx handles all navigation based on auth state.
 * We don't redirect here to avoid double navigation (index → tabs → auth/login)
 * which causes duplicate session fetches.
 */
export default function Index() {
  return null;
}
