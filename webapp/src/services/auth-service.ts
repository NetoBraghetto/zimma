import AppEvents from "@/constants/app-events";
import { FormatSuccessResponse, type SucessServerResponse } from "@/lib/format-success-response";
import { api } from "@/services/http-client";
import { DeviceService } from "./device-service";
import eventManager from "./event-manager";
import { JWTService } from "./jwt-service";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type MfaVerifyPayload = {
  mfa_token: string;
  code: string;
  device_id: string;
  trust_device?: boolean;
};

export type MfaSetupResponse = {
  secret: string;
  otpauth_url: string;
};

export type PasswordUpdatePayload = {
  password: string;
  new_password: string;
  new_password_confirmation: string;
};

export type AuthModel = {
  id: number;
  name: string;
  email: string;
  permissions: string[];
  roles: string[];
  mfa_enabled: boolean;
};

export type AuthTokenResponse = {
  token: string;
  token_type: "bearer";
  user: AuthModel;
  mfa_required?: boolean | null;
  mfa_token?: string | null;
  device_token?: string | null;
};

export type RegisterPayload = {
  email: string;
  password: string;
};

class AuthService {
  protected path = "auth";

  authenticate(credentials: AuthCredentials): Promise<SucessServerResponse<AuthTokenResponse>> {
    return new Promise((resolve, reject) => {
      api
        .post(
          `${this.path}/login`,
          JSON.stringify({
            ...credentials,
            device_id: DeviceService.getDeviceId(),
            device_token: DeviceService.getDeviceToken(),
          }),
          {
            headers: {
              Authorization: "",
            },
          },
        )
        .then((response) => {
          const parsedResponse = FormatSuccessResponse<AuthTokenResponse, Record<string, never>>(response);
          if (!parsedResponse.data.mfa_required) {
            JWTService.setToken(parsedResponse.data.token);
            eventManager.fire(AppEvents.onLogin, parsedResponse.data);
          }
          resolve(parsedResponse);
        })
        .catch((error) => {
          reject(error);
          // reject(FormatErrorResponse(error));
        });
    });
  }

  mfaVerify(payload: MfaVerifyPayload): Promise<SucessServerResponse<AuthTokenResponse>> {
    return new Promise((resolve, reject) => {
      api
        .post(`${this.path}/mfa/verify`, JSON.stringify(payload), {
          headers: {
            Authorization: "",
          },
        })
        .then((response) => {
          const parsedResponse = FormatSuccessResponse<AuthTokenResponse, Record<string, never>>(response);
          JWTService.setToken(parsedResponse.data.token);
          if (parsedResponse.data.device_token) {
            DeviceService.setDeviceToken(parsedResponse.data.device_token);
          }
          eventManager.fire(AppEvents.onLogin, parsedResponse.data);
          resolve(parsedResponse);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  mfaSetup(): Promise<SucessServerResponse<MfaSetupResponse>> {
    return new Promise((resolve, reject) => {
      api
        .post(`${this.path}/mfa/setup`)
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  mfaConfirm(sendData: { code: string }): Promise<SucessServerResponse<null>> {
    return new Promise((resolve, reject) => {
      api
        .post(`${this.path}/mfa/confirm`, JSON.stringify(sendData))
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  mfaDisable(sendData: { password: string }): Promise<SucessServerResponse<null>> {
    return new Promise((resolve, reject) => {
      api
        .delete(`${this.path}/mfa`, { data: sendData })
        .then((response) => {
          DeviceService.clearDeviceToken();
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  me(): Promise<SucessServerResponse<AuthModel>> {
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
      api
        .get("/me", {
          signal: controller.signal,
        })
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  logout(): void {
    JWTService.clearToken();
    eventManager.fire(AppEvents.onLogout);
  }

  passwordRecovery(sendData: { email: string }): Promise<SucessServerResponse<null>> {
    return new Promise((resolve, reject) => {
      api
        .post(`${this.path}/password-recovery`, JSON.stringify(sendData))
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  passwordReset(sendData: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<SucessServerResponse<null>> {
    return new Promise((resolve, reject) => {
      api
        .post(`${this.path}/password-reset`, JSON.stringify(sendData))
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  passwordUpdate(sendData: PasswordUpdatePayload): Promise<SucessServerResponse<null>> {
    return new Promise((resolve, reject) => {
      api
        .post(`${this.path}/password-update`, JSON.stringify(sendData))
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  register(sendData: RegisterPayload): Promise<SucessServerResponse<null>> {
    return new Promise((resolve, reject) => {
      api
        .post(`${this.path}/register`, JSON.stringify(sendData))
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}
export const authService = new AuthService();
