export type Role = 'user' | 'staff' | 'admin' | 'superadmin';

export type Action = 
  | 'manage_staff'
  | 'manage_zones'
  | 'manage_locks'
  | 'manage_bookings'
  | 'manage_payments'
  | 'system_settings';

const ROLES_PERMISSIONS: Record<Role, Action[]> = {
  superadmin: [
    'manage_staff',
    'manage_zones',
    'manage_locks',
    'manage_bookings',
    'manage_payments',
    'system_settings',
  ],
  admin: [
    'manage_staff',
    'manage_zones',
    'manage_locks',
    'manage_bookings',
    'manage_payments',
  ],
  staff: [
    'manage_locks',
    'manage_bookings',
    'manage_payments',
  ],
  user: [],
};

export function hasPermission(role: Role | string | undefined, action: Action): boolean {
  if (!role) return false;
  const permissions = ROLES_PERMISSIONS[role as Role] || [];
  return permissions.includes(action);
}

export function canAccessAdminPanel(role: Role | string | undefined): boolean {
  return ['staff', 'admin', 'superadmin'].includes(role as string);
}
