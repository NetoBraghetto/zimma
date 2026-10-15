import { AxiosError } from "axios";
import { toast } from "sonner";
import AppEvents from "@/constants/app-events";
import { FormatSuccessResponse, type SucessServerResponse } from "@/lib/format-success-response";
import type { AuthTokenResponse } from "./auth-service";
import eventManager from "./event-manager";
import { api } from "./http-client";
import { JWTService } from "./jwt-service";

export type OAuthProvider = "google" | "instagram";
export type OAuthMode = "login" | "link";

export type SocialAccountModel = {
  provider: OAuthProvider;
  username: string;
  created_at: string;
};

export type SocialAccountsMeta = {
  providers: Record<OAuthProvider, boolean>;
};

export type OAuthExchangeResponse = AuthTokenResponse & {
  mode: OAuthMode;
  provider: OAuthProvider;
};

export const OAUTH_PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: "Google",
  instagram: "Instagram",
};

const NONCE_KEY = "oauth-nonce";

class OAuthService {
  /**
   * Asks the API for the provider consent URL and sends the browser there.
   * The nonce stays in sessionStorage so only this tab can finish the flow.
   */
  async start(provider: OAuthProvider, mode: OAuthMode = "login"): Promise<void> {
    try {
      const path = mode === "link" ? `auth/oauth/${provider}/link` : `auth/oauth/${provider}/authorize`;
      const response = await api.post(path);
      const { data } = FormatSuccessResponse<{ url: string; nonce: string }, Record<string, never>>(response);
      window.sessionStorage.setItem(NONCE_KEY, data.nonce);
      window.location.assign(data.url);
    } catch (err) {
      const label = OAUTH_PROVIDER_LABEL[provider];
      if (err instanceof AxiosError && err.response?.status === 503) {
        toast.error(`Acesso com ${label} indisponível`, { description: "Esta opção ainda não foi configurada." });
      } else {
        toast.error(`Não foi possível conectar com ${label}`, { description: "Tente novamente." });
      }
    }
  }

  async exchange(code: string): Promise<SucessServerResponse<OAuthExchangeResponse>> {
    const nonce = window.sessionStorage.getItem(NONCE_KEY) || "";
    window.sessionStorage.removeItem(NONCE_KEY);

    const response = await api.post("auth/oauth/exchange", JSON.stringify({ code, nonce }), {
      headers: { Authorization: "" },
    });
    const parsed = FormatSuccessResponse<OAuthExchangeResponse, Record<string, never>>(response);
    JWTService.setToken(parsed.data.token, parsed.data.refresh_token);
    eventManager.fire(AppEvents.onLogin, parsed.data);
    return parsed;
  }

  async accounts(): Promise<SucessServerResponse<SocialAccountModel[], SocialAccountsMeta>> {
    const response = await api.get("me/social-accounts");
    return FormatSuccessResponse(response);
  }

  async unlink(provider: OAuthProvider): Promise<void> {
    await api.delete(`me/social-accounts/${provider}`);
  }
}

export const oauthService = new OAuthService();
