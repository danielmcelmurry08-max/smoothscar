import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { appleSignIn, exchangeGoogleSession, getMe, logoutApi, setAuthToken, setOnUnauthorized, User } from "./api";
import { storage } from "./utils/storage";
import { queryClient } from "./query-client";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = "biorna_session_token";
const AUTH_URL = "https://auth.emergentagent.com/";

type AuthState = {
  user: User | null;
  loading: boolean;
  authError: string;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const extractSessionId = (url: string | null | undefined) => url?.match(/[?#&]session_id=([^&#]+)/)?.[1] ?? null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const sent = useRef(new Set<string>());

  const clear = useCallback(async () => {
    await storage.secureRemove(TOKEN_KEY);
    setAuthToken(null);
    queryClient.clear();
    setUser(null);
  }, []);

  const finish = useCallback(async (token: string, u: User) => {
    await storage.secureSet(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(u);
  }, []);

  const exchange = useCallback(
    async (sessionId: string) => {
      if (sent.current.has(sessionId)) return false;
      sent.current.add(sessionId);
      const res = await exchangeGoogleSession(sessionId);
      await finish(res.session_token, res.user);
      return true;
    },
    [finish],
  );

  useEffect(() => {
    setOnUnauthorized(() => {
      clear();
    });
    let linkSub: { remove: () => void } | undefined;
    (async () => {
      try {
        // 1. Process session_id from the URL first
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const sid = extractSessionId(window.location.hash) || extractSessionId(window.location.search);
          if (sid) {
            try {
              await exchange(sid);
            } catch (e) {
              setAuthError(e instanceof Error ? e.message : "Google sign-in failed. Please try again.");
            }
            const url = new URL(window.location.href);
            url.searchParams.delete("session_id");
            const hash = url.hash.replace(/^#/, "").split("&").filter((p) => p && !p.startsWith("session_id=")).join("&");
            window.history.replaceState(window.history.state, "", url.pathname + url.search + (hash ? `#${hash}` : ""));
            return;
          }
        } else {
          const sid = extractSessionId(await Linking.getInitialURL());
          if (sid && (await exchange(sid).catch(() => false))) return;
          linkSub = Linking.addEventListener("url", ({ url }) => {
            const s = extractSessionId(url);
            if (s) exchange(s).catch(() => undefined);
          });
        }
        // 2. Existing session
        const token = await storage.secureGet(TOKEN_KEY, null as string | null);
        if (token) {
          setAuthToken(token);
          try {
            setUser(await getMe());
          } catch {
            await clear();
          }
        }
      } catch {
        await clear();
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      linkSub?.remove();
      setOnUnauthorized(null);
    };
  }, [exchange, clear]);

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === "web") {
      const redirect = `${window.location.origin}/account`;
      window.location.href = `${AUTH_URL}?redirect=${encodeURIComponent(redirect)}`;
      return;
    }
    const redirect = Linking.createURL("account");
    let captured: string | null = null;
    const sub = Linking.addEventListener("url", ({ url }) => {
      captured = url;
    });
    try {
      const result = await WebBrowser.openAuthSessionAsync(`${AUTH_URL}?redirect=${encodeURIComponent(redirect)}`, redirect);
      const url = (result.type === "success" ? result.url : null) || captured || (await Linking.getInitialURL());
      const sid = extractSessionId(url);
      if (!sid) {
        if (result.type === "success") throw new Error("Sign-in didn't complete. Please try again.");
        return; // genuinely cancelled
      }
      await exchange(sid);
    } finally {
      sub.remove();
    }
  }, [exchange]);

  const signInWithApple = useCallback(async () => {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!cred.identityToken) throw new Error("Apple didn't return a sign-in token");
      const fullName = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(" ") || null;
      const res = await appleSignIn({ identity_token: cred.identityToken, full_name: fullName, email: cred.email ?? null });
      await finish(res.session_token, res.user);
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "ERR_REQUEST_CANCELED") return;
      throw e;
    }
  }, [finish]);

  const signOut = useCallback(async () => {
    await logoutApi().catch(() => undefined);
    await clear();
  }, [clear]);

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError: () => setAuthError(""), signInWithGoogle, signInWithApple, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
