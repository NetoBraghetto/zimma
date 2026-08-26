import axios from "axios";
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
