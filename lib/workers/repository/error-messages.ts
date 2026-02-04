import type { ValidationMessage } from '../../config/types.ts';
import {
  CONFIG_SECRETS_EXPOSED,
  CONFIG_VALIDATION,
  EXTERNAL_HOST_ERROR,
  MANAGER_LOCKFILE_ERROR,
  MISSING_API_CREDENTIALS,
  PLATFORM_AUTHENTICATION_ERROR,
  PLATFORM_BAD_CREDENTIALS,
  PLATFORM_INTEGRATION_UNAUTHORIZED,
  PLATFORM_RATE_LIMIT_EXCEEDED,
  SYSTEM_INSUFFICIENT_DISK_SPACE,
  SYSTEM_INSUFFICIENT_MEMORY,
  UNKNOWN_ERROR,
} from '../../constants/error-messages.ts';
import type { RepositoryResult } from './result.ts';

export interface RuntimeErrorContext {
  hostType?: string;
  packageName?: string;
  validationMessage?: string;
}

interface ErrorMapping {
  topic: string;
  message: string | ((context?: RuntimeErrorContext) => string);
}

const errorMappings: Record<string, ErrorMapping> = {
  [SYSTEM_INSUFFICIENT_DISK_SPACE]: {
    topic: 'System Error',
    message: 'Insufficient disk space to complete the operation.',
  },
  [SYSTEM_INSUFFICIENT_MEMORY]: {
    topic: 'System Error',
    message: 'Insufficient memory to complete the operation.',
  },
  [PLATFORM_AUTHENTICATION_ERROR]: {
    topic: 'Platform Error',
    message: 'Authentication failed. Please check your credentials.',
  },
  [PLATFORM_BAD_CREDENTIALS]: {
    topic: 'Platform Error',
    message:
      'Invalid credentials provided. Please verify your authentication settings.',
  },
  [PLATFORM_RATE_LIMIT_EXCEEDED]: {
    topic: 'Platform Error',
    message: 'Rate limit exceeded. Renovate will retry later.',
  },
  [PLATFORM_INTEGRATION_UNAUTHORIZED]: {
    topic: 'Platform Error',
    message: 'Integration is not authorized to access this repository.',
  },
  [EXTERNAL_HOST_ERROR]: {
    topic: 'External Host Error',
    message: (context?: RuntimeErrorContext) => {
      if (context?.hostType && context?.packageName) {
        return `Error connecting to ${context.hostType} for package "${context.packageName}".`;
      }
      if (context?.hostType) {
        return `Error connecting to external host: ${context.hostType}.`;
      }
      return 'Error connecting to an external host.';
    },
  },
  [MANAGER_LOCKFILE_ERROR]: {
    topic: 'Lockfile Error',
    message: 'Failed to generate lockfile. Check the logs for more details.',
  },
  [CONFIG_VALIDATION]: {
    topic: 'Configuration Error',
    message: (context?: RuntimeErrorContext) => {
      if (context?.validationMessage) {
        return context.validationMessage;
      }
      return 'Invalid Renovate configuration. Please check your config file.';
    },
  },
  [CONFIG_SECRETS_EXPOSED]: {
    topic: 'Security Error',
    message:
      'Secrets may have been exposed in the repository. Operation aborted for security.',
  },
  [MISSING_API_CREDENTIALS]: {
    topic: 'Credentials Error',
    message:
      'Missing API credentials for one or more package registries. Please configure the required credentials.',
  },
  [UNKNOWN_ERROR]: {
    topic: 'Unknown Error',
    message: 'An unexpected error occurred. Check the logs for more details.',
  },
};

/**
 * Creates a ValidationMessage for runtime errors that should be surfaced to users.
 * Returns null for expected states (like repository disabled) that don't need error reporting.
 */
export function createRuntimeError(
  result: RepositoryResult,
  context?: RuntimeErrorContext,
): ValidationMessage | null {
  const mapping = errorMappings[result];
  if (!mapping) {
    return null;
  }

  const message =
    typeof mapping.message === 'function'
      ? mapping.message(context)
      : mapping.message;

  return {
    topic: mapping.topic,
    message,
  };
}
