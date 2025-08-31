export enum PaymentMessages {
  USER_NOT_FOUND = 'User not found',
  SETUP_INTENT_NOT_FOUND = 'Setup intent not found',
  PAYMENT_METHOD_NOT_FOUND = 'Payment method not found',
  PAYMENT_METHOD_NOT_VERIFIED = 'Payment method has not been verified yet',
  FRANCHISE_CONFIG_NOT_FOUND = 'Franchise config not found',
  MEMBERSHIP_NOT_FOUND = 'Membership transaction not found',
  DEFAULT_PAYMENT_METHOD_DELETE = 'Please set another payment method as default then try again',
  DETACH_PAYMENT_METHOD_ERROR = 'Something went wrong. Unable to delete payment method',
  PAYMENT_METHOD_DEL_ALL = 'You must have atleast one verified payment method to continue',
}
