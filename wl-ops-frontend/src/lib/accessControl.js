export const ROLES = [
  'HOD',
  'Site Supervisor',
  'Procurement',
  'Accounts',
  'Store',
  'Fleet',
  'Marine',
  'Compliance',
  'Staff',
];

export const ROLE_PERMISSIONS = {
  HOD: ['*'],
  'Site Supervisor': ['dashboard', 'issues', 'fleet', 'vessels', 'inventory'],
  Procurement: ['dashboard', 'issues', 'procurement', 'srm', 'master'],
  Accounts: ['dashboard', 'procurement', 'reports'],
  Store: ['dashboard', 'inventory', 'procurement'],
  Fleet: ['dashboard', 'fleet', 'issues', 'staff'],
  Marine: ['dashboard', 'vessels', 'issues', 'staff'],
  Compliance: ['dashboard', 'compliance', 'reports', 'staff'],
  Staff: ['dashboard', 'issues'],
};

export function roleForStaff(staff = {}) {
  const designation = String(staff.Designation || staff.Category || '').toLowerCase();
  if (designation.includes('hod') || designation.includes('director') || designation.includes('manager')) return 'HOD';
  if (designation.includes('supervisor') || designation.includes('site')) return 'Site Supervisor';
  if (designation.includes('proc')) return 'Procurement';
  if (designation.includes('account') || designation.includes('finance')) return 'Accounts';
  if (designation.includes('store') || designation.includes('warehouse')) return 'Store';
  if (designation.includes('fleet') || designation.includes('operator') || designation.includes('mechanic')) return 'Fleet';
  if (designation.includes('captain') || designation.includes('marine') || designation.includes('crew')) return 'Marine';
  if (designation.includes('compliance') || designation.includes('admin')) return 'Compliance';
  return 'Staff';
}

export function canAccess(user, permission) {
  if (!user) return false;
  const grants = ROLE_PERMISSIONS[user.role] || [];
  return grants.includes('*') || grants.includes(permission);
}
