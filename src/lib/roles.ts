/** Roles treated as platform admin for UI gates. Extend if your API uses different values. */
const ADMIN_ROLES = new Set(["ADMIN", "SUPERUSER"]);

export function isAdminRole(role?: string | null): boolean {
  if (!role || typeof role !== "string") return false;
  return ADMIN_ROLES.has(role.trim().toUpperCase());
}
