// biome-ignore lint/complexity/noStaticOnlyClass: exception
export class DeviceService {
  private static deviceIdKey = "device-id";
  private static deviceTokenKey = "device-token";

  public static getDeviceId(): string {
    let deviceId = window.localStorage.getItem(DeviceService.deviceIdKey);
    if (!deviceId) {
      deviceId = window.crypto.randomUUID();
      window.localStorage.setItem(DeviceService.deviceIdKey, deviceId);
    }
    return deviceId;
  }

  public static getDeviceToken(): string | null {
    return window.localStorage.getItem(DeviceService.deviceTokenKey);
  }

  public static setDeviceToken(token: string): void {
    window.localStorage.setItem(DeviceService.deviceTokenKey, token);
  }

  public static clearDeviceToken(): void {
    window.localStorage.removeItem(DeviceService.deviceTokenKey);
  }
}
