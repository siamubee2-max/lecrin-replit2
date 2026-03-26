import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { setSentryUser, clearSentryUser } from "@/lib/sentry";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

function mapSupabaseUser(u: SupabaseUser): AuthUser {
  return {
    id: u.id,
    email: u.email ?? null,
    name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? null,
    loginMethod: u.app_metadata?.provider ?? null,
    lastSignedIn: new Date(u.last_sign_in_at ?? u.created_at),
  };
}

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const handleSession = useCallback((session: Session | null) => {
    if (session?.user) {
      const mapped = mapSupabaseUser(session.user);
      setUser(mapped);
      setSentryUser(mapped.id, mapped.email ?? undefined);
    } else {
      setUser(null);
      clearSentryUser();
    }
  }, []);

  const fetchUser = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch user"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [handleSession]);

  useEffect(() => {
    if (!autoFetch || !supabase) {
      setLoading(false);
      return;
    }

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, [autoFetch, fetchUser, handleSession]);

  const logout = useCallback(async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch {
      // continue
    } finally {
      setUser(null);
      setError(null);
      clearSentryUser();
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    refresh: fetchUser,
    logout,
  };
}
