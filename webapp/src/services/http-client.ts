import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import AppEvents from "@/constants/app-events";
import Config from "@/services/config-service";
import { JWTService } from "@/services/jwt-service";
import type { AuthTokenResponse } from "./auth-service";
import eventManager from "./event-manager";

export const api = axios.create({
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
    Authorization: `Bearer ${(await JWTService.getToken()) || ""}`,
  },
  withCredentials: true,
  baseURL: Config.get("API"),
  validateStatus(status) {
    return status < 400;
  },
});

eventManager.subscribe(AppEvents.onLogin, (data: AuthTokenResponse) => {
  api.defaults.headers.Authorization = `Bearer ${data.token}`;
});

eventManager.subscribe(AppEvents.onLogout, () => {
  delete api.defaults.headers.Authorization;
});

type RetriableRequest = InternalAxiosRequestConfig & { _retried?: boolean };

// A single refresh runs at a time; requests that fail meanwhile wait for it.
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = JWTService.getRefreshToken();
  if (!refreshToken) {
    throw new Error("no refresh token");
  }

  try {
    // Plain axios, so this request does not go through the interceptors below.
    const response = await axios.post(
      "auth/refresh",
      { refresh_token: refreshToken },
      { baseURL: Config.get("API"), withCredentials: true, headers: { "X-Requested-With": "XMLHttpRequest" } },
    );
    const data = response.data.data as AuthTokenResponse;
    JWTService.setToken(data.token, data.refresh_token);
    return data.token;
  } catch (error) {
    // Another tab may have used this refresh token first and stored a new pair.
    const current = JWTService.getRefreshToken();
    const token = await JWTService.getToken();
    if (current && current !== refreshToken && token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      return token;
    }
    throw error;
  }
}

function hasBearerToken(config?: InternalAxiosRequestConfig): boolean {
  const authorization = String(config?.headers?.Authorization ?? "");
  return authorization.startsWith("Bearer ") && authorization.length > "Bearer ".length;
}

// When the access token expires, gets a new one with the refresh token and retries the request.
// Requests sent without a token (login, password recovery...) are left alone.
api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const request = error.config as RetriableRequest | undefined;
  if (error.response?.status !== 401 || !request || request._retried || !hasBearerToken(request)) {
    return Promise.reject(error);
  }
  request._retried = true;

  try {
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    const token = await refreshing;
    request.headers.Authorization = `Bearer ${token}`;
    return api(request);
  } catch (_refreshError) {
    if (JWTService.getRefreshToken() !== null || (await JWTService.getToken()) !== null) {
      toast.info("Sua sessão expirou", { description: "Faça login novamente para continuar." });
    }
    JWTService.clearToken();
    eventManager.fire(AppEvents.onLogout);
    return Promise.reject(error);
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 403:
          toast.warning("Usuário sem permissão para esta ação. 😬");
          break;
        default:
          break;
      }
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error("Error", error);
    }
    return Promise.reject(error);
  },
);
