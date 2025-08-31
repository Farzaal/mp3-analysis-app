export enum FranchiseMessages {
  FRANCHISE_ALREADY_EXITSTS = 'franchise already exists with this site ID',
  FRANCHISE_ADMIN_NOT_FOUND = 'Franchise admin not found',
  UNAUTHORIZED_PERMISSION = 'You are not authorized to perform this action',
  FRANCHISE_NOT_FOUND = 'franchise not found',
  FRANCHISE_ID_NOT_FOUND = 'franchise id not found',
  TOWN_SERVICE_LOCATION_NOT_UNIQUE = 'In a service location, town id should be unique',
  ONLY_SUPER_ADMIN_CAN_CHANGE_ACTIVE_STATUS = 'Only Super Admin can change the active status',
  EMAIL_EXISTS = 'Email already exists, please use a different email',
  STRIPE_KEYS_ERROR = 'Please provide valid stripe keys',
  INVALID_SECRET = 'Invalid stripe secret key',
  TOWN_NOT_FOUND = 'Service area not found',
}
