// Validation messages for error handling
export const VALIDATION_MESSAGES = {
  INVALID_TOKEN: 'The provided token is invalid',
  NO_TOKEN: 'No token provided',
  UNAUTHORIZED: 'Please you are not authorized to access resource',
  INVALID_ROLE: 'The provided role is invalid',
  INVALID_GENDER: 'The provided gender is invalid, should male or female',
  INVALID_INSPECTION_STATUS:
    'The provided inspection status is invalid, should be in [ submitted, concluded, reviewed]',
  INVALID_INSPECTOR_ROLE:
    'The provided role is invalid, should be in [ inspector, environmentalist, supervisor]',
} as const;

// Validation values for checking input
export const VALIDATION_VALUES = {
  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
  },
  INSPECTION_STATUS: {
    SUBMITTED: 'submitted',
    CONCLUDED: 'concluded',
    REVIEWED: 'reviewed',
  },
  INSPECTOR_ROLE: {
    INSPECTOR: 'inspector',
    ENVIRONMENTALIST: 'environmentalist',
    SUPERVISOR: 'supervisor',
  },
  FLAG_VALUES: {
    RED: 'red',
    GREEN: 'green',
    YELLOW: 'yellow',
    NO: 'NO',
  },
} as const;
