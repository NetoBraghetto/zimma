import { api } from "./http-client.ts";

export type JWTHeader = {
  typ: "JWT";
  alg: "HS256";
};
export type JWTPayload = {
  iss: string;
  iat: number;
  exp: number;
  nbf: number;
  jti: string;
  sub: string;
  prv: string;
};
export type DecodedJWT = {
  header: JWTHeader;
  payload: JWTPayload;
};

// biome-ignore lint/complexity/noStaticOnlyClass: exception
export class JWTService {
  private static key = "jwt-token";

  public static async getToken(): Promise<string | null> {
    return window.localStorage.getItem(JWTService.key);
  }

  public static setToken(token: string): void {
    window.localStorage.setItem(JWTService.key, token);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  }

  public static clearToken(): void {
    window.localStorage.removeItem(JWTService.key);
    delete api.defaults.headers.Authorization;
  }

  public static decodeToken(token: string): DecodedJWT {
    const [header, payload] = token.split(".");
    return {
      header: JSON.parse(window.atob(header)) as JWTHeader,
      payload: JSON.parse(window.atob(payload)) as JWTPayload,
    };
  }
}
