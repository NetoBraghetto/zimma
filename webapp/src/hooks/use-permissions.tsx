import { useCallback } from "react";
import type { Permission, Role } from "@/services/user-service";
import { useAuth } from "./use-auth";

type UsePermissionsReturn = {
  can: (permission: Permission["id"]) => boolean;
  hasRole: (role: Role["id"]) => boolean;
};

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();

  const can = useCallback(
    (permission: Permission["id"]) => {
      if (!user) {
        return false;
      }
      return user.permissions.indexOf(permission) > -1;
    },
    [user],
  );

  const hasRole = useCallback(
    (role: Role["id"]) => {
      if (!user) {
        return false;
      }
      return user.roles.indexOf(role) > -1;
    },
    [user],
  );

  return { can, hasRole };
}
