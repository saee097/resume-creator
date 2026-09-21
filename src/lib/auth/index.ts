export {
  signToken,
  verifyToken,
  createSessionRecord,
  destroySession,
  destroyAllUserSessions,
} from "./session";
export type { JwtPayload } from "./session";

export { hashPassword, verifyPassword } from "./password";

export {
  generateSecret,
  generateTotpUri,
  verifyTotp,
  generateBackupCodes,
} from "./2fa";

export { linkOAuthAccount, getOAuthAccount } from "./oauth";
export type { OAuthProviderConfig } from "./oauth";

export {
  resolveDevice,
  listDevices,
  trustDevice,
  revokeDevice,
  parseUserAgent,
} from "./devices";

export {
  getUserPermissions,
  hasPermission,
  assignRole,
  removeRole,
} from "./rbac";