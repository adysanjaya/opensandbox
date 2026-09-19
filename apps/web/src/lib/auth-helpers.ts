/**
 * Checks if a user has administrative privileges.
 * Supports:
 * 1. Explicit role === 'admin'
 * 2. NEXT_PUBLIC_SUPERADMIN_EMAIL environment variable
 * 3. Default fallback for system administrator
 */
export function isSuperAdmin(
  user?: { email?: string | null; role?: string | null } | null
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const userEmail = user.email?.toLowerCase().trim();
  if (!userEmail) return false;

  const configuredSuperAdmin = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL?.toLowerCase().trim();
  if (configuredSuperAdmin && userEmail === configuredSuperAdmin) {
    return true;
  }

  return userEmail === 'adysanjaya013@gmail.com';
}
