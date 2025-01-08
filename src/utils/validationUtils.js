import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Custom error messages for validation failures
const ERROR_MESSAGES = {
  required: (field) => `${field} is required`,
  type: (field, type) => `${field} must be a ${type}`,
  minimum: (field, min) => `${field} must be greater than or equal to ${min}`,
  maximum: (field, max) => `${field} must be less than or equal to ${max}`,
  enum: (field, values) => `${field} must be one of: ${values.join(', ')}`,
  format: (field, format) => `${field} must be a valid ${format}`,
  pattern: (field) => `${field} format is invalid`,
  minLength: (field, length) => `${field} must be at least ${length} characters long`,
  maxLength: (field, length) => `${field} must not exceed ${length} characters`
};

// Format validation error messages
const formatError = (error) => {
  const field = error.instancePath.replace('/', '') || error.params.missingProperty;
  
  switch (error.keyword) {
    case 'required':
      return ERROR_MESSAGES.required(field);
    case 'type':
      return ERROR_MESSAGES.type(field, error.params.type);
    case 'minimum':
      return ERROR_MESSAGES.minimum(field, error.params.limit);
    case 'maximum':
      return ERROR_MESSAGES.maximum(field, error.params.limit);
    case 'enum':
      return ERROR_MESSAGES.enum(field, error.params.allowedValues);
    case 'format':
      return ERROR_MESSAGES.format(field, error.params.format);
    case 'pattern':
      return ERROR_MESSAGES.pattern(field);
    case 'minLength':
      return ERROR_MESSAGES.minLength(field, error.params.limit);
    case 'maxLength':
      return ERROR_MESSAGES.maxLength(field, error.params.limit);
    default:
      return error.message;
  }
};

// Validate API request against schema
export const validateApiRequest = async (data, schema) => {
  const validate = ajv.compile(schema);
  const isValid = validate(data);

  if (!isValid) {
    const errors = validate.errors.map(formatError);
    throw new ValidationError('Validation failed', errors);
  }

  return true;
};

// Custom validation error class
export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// Common validation schemas
export const commonSchemas = {
  email: {
    type: 'string',
    format: 'email',
    maxLength: 255
  },
  phone: {
    type: 'string',
    pattern: '^\\+?[1-9]\\d{1,14}$'
  },
  zipCode: {
    type: 'string',
    pattern: '^[0-9]{5}(?:-[0-9]{4})?$'
  },
  coordinates: {
    type: 'object',
    required: ['lat', 'lng'],
    properties: {
      lat: {
        type: 'number',
        minimum: -90,
        maximum: 90
      },
      lng: {
        type: 'number',
        minimum: -180,
        maximum: 180
      }
    }
  },
  address: {
    type: 'object',
    required: ['street', 'city', 'state', 'zipCode'],
    properties: {
      street: {
        type: 'string',
        maxLength: 100
      },
      city: {
        type: 'string',
        maxLength: 50
      },
      state: {
        type: 'string',
        pattern: '^[A-Z]{2}$'
      },
      zipCode: {
        $ref: '#/definitions/zipCode'
      }
    }
  }
};

// Validate specific data types
export const validateEmail = (email) => {
  return validateApiRequest({ email }, {
    type: 'object',
    required: ['email'],
    properties: {
      email: commonSchemas.email
    }
  });
};

export const validatePhone = (phone) => {
  return validateApiRequest({ phone }, {
    type: 'object',
    required: ['phone'],
    properties: {
      phone: commonSchemas.phone
    }
  });
};

export const validateAddress = (address) => {
  return validateApiRequest({ address }, {
    type: 'object',
    required: ['address'],
    properties: {
      address: commonSchemas.address
    }
  });
};

// Validate array of items against a schema
export const validateArray = async (items, itemSchema, options = {}) => {
  const { minItems = 1, maxItems = 1000 } = options;

  const arraySchema = {
    type: 'array',
    minItems,
    maxItems,
    items: itemSchema
  };

  return validateApiRequest(items, arraySchema);
};

// Sanitize data before validation
export const sanitizeData = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}; 