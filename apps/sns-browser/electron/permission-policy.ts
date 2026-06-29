import type { Session } from "electron";

const allowedPermissions = new Set(["notifications"]);

export function installPermissionPolicy(session: Session) {
  session.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(allowedPermissions.has(permission));
  });

  session.setPermissionCheckHandler((_webContents, permission) => {
    return allowedPermissions.has(permission);
  });
}
