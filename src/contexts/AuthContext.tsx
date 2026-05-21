"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  User,
  Session,
  AuthError,
  Provider as SupabaseProvider,
} from "@supabase/supabase-js";

import { supabase, Profile } from "../lib/supabase";

interface AuthContextType {
  user: User | null;

  profile: Profile | null;

  session: Session | null;

  loading: boolean;

  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;

  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: AuthError | null }>;

  signInWithOAuth: (
    provider: Extract<SupabaseProvider, "google" | "facebook">,
  ) => Promise<{ error: AuthError | null }>;

  signOut: () => Promise<void>;

  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label}_timeout`));
    }, timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);

  const clearAuthCallbackUrl = () => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const authSearchParams = ["code", "state", "error", "error_code", "error_description"];
    const hasAuthSearchParam = authSearchParams.some((key) =>
      url.searchParams.has(key),
    );
    const hasAuthHash =
      url.hash.includes("access_token") ||
      url.hash.includes("refresh_token") ||
      url.hash.includes("error");

    if (hasAuthSearchParam || hasAuthHash) {
      window.history.replaceState({}, document.title, url.pathname || "/");
    }
  };

  // =========================
  // FETCH PROFILE
  // =========================

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single(),
        12000,
        "fetch_profile",
      );

      if (error) {
        console.error("Fetch profile error:", error);

        return;
      }

      setProfile(data);
    } catch (err) {
      console.error("Unexpected profile error:", err);
    }
  };

  // =========================
  // REFRESH PROFILE
  // =========================

  const refreshProfile = async () => {
    if (!user) return;

    await fetchProfile(user.id);
  };

  // =========================
  // INITIAL SESSION
  // =========================

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await withTimeout(
          supabase.auth.getSession(),
          10000,
          "get_session",
        );

        setSession(session);

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Get session error:", err);
      } finally {
        clearAuthCallbackUrl();
        setLoading(false);
      }
    };

    getInitialSession();

    // =========================
    // AUTH LISTENER
    // =========================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // SIGN IN
  // =========================

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (
          error.message?.includes("Invalid login credentials") ||
          error.message?.includes("Email not confirmed")
        ) {
          console.warn("LOGIN FAILED:", error.message);
        } else {
          console.error("LOGIN ERROR:", error.message);
        }

        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected sign in error:", err);

      return { error: err as AuthError };
    }
  };

  // =========================
  // OAUTH SIGN IN
  // =========================

  const signInWithOAuth = async (
    provider: Extract<SupabaseProvider, "google" | "facebook">,
  ) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          scopes:
            provider === "facebook" ? "email,public_profile" : "email profile",
        },
      });

      if (error) {
        console.error("OAUTH LOGIN ERROR:", error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected OAuth sign in error:", err);
      return { error: err as AuthError };
    }
  };

  // =========================
  // SIGN UP
  // =========================

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error("SIGNUP ERROR:", error.message);

        return { error };
      }

      // The database trigger creates the profile row; this keeps the name in
      // sync if the trigger runs before metadata is available.
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName, updated_at: new Date().toISOString() })
          .eq("id", data.user.id);

        if (profileError) {
          console.error("PROFILE UPDATE ERROR:", profileError.message);
        }
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected signup error:", err);

      return { error: err as AuthError };
    }
  };

  // =========================
  // SIGN OUT
  // =========================

  const signOut = async () => {
    try {
      await supabase.auth.signOut();

      setUser(null);

      setProfile(null);

      setSession(null);
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      clearAuthCallbackUrl();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signInWithOAuth,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =========================
// USE AUTH
// =========================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
