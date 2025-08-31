export enum ResponseMessage {
  UNAUTHORIZED = 'Unauthorized for request. Token Mismatch.',
  SUCCESS = 'Success',
  SUCCESS_WITH_NO_CONTENT = 'No Content',
  NOT_FOUND = 'Resource Not found',
  CONFLICT = 'The request could not be completed due to a conflict with the current state of the resource',
  FORBIDDEN = 'Not allowed for performing this action.',
  BAD_REQUEST = 'Bad Request. Please verify your request input.',
  SERVER_ERROR = 'Internal Server Error',
  UNPROCESSABLE_ENTITY = 'Validation Error',
}
