import * as React from "react";
import AppEvents from "@/constants/app-events";
import { type AuthModel, type AuthTokenResponse, authService } from "@/services/auth-service";
import em from "@/services/event-manager";

export interface AuthContext {
  isAuthenticated: boolean;
  isRequesting: boolean;
  user: AuthModel | false;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = React.useState<Omit<AuthContext, "isAuthenticated" | "refreshUser">>({
    user: false,
    isRequesting: true,
  });
  const isAuthenticated = auth.user !== false;

  const refreshUser = React.useCallback(async () => {
    try {
      const { data } = await authService.me();
      setAuth({
        user: data,
        isRequesting: false,
      });
    } catch (_error) {
      setAuth({
        user: false,
        isRequesting: false,
      });
    }
  }, []);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  React.useEffect(() => {
    const unsubscribe = em.subscribe(AppEvents.onLogin, (data: AuthTokenResponse) => {
      setAuth(() => ({ user: data.user, isRequesting: false }));
    });
    const unsubscribeLogout = em.subscribe(AppEvents.onLogout, () => {
      setAuth(() => ({ user: false, isRequesting: false }));
    });

    return () => {
      unsubscribe();
      unsubscribeLogout();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user: auth.user, isAuthenticated, isRequesting: auth.isRequesting, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
