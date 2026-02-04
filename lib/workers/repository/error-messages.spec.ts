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
  REPOSITORY_ARCHIVED,
  REPOSITORY_DISABLED,
  SYSTEM_INSUFFICIENT_DISK_SPACE,
  SYSTEM_INSUFFICIENT_MEMORY,
  TEMPORARY_ERROR,
  UNKNOWN_ERROR,
} from '../../constants/error-messages.ts';
import { createRuntimeError } from './error-messages.ts';

describe('workers/repository/error-messages', () => {
  describe('createRuntimeError()', () => {
    describe('returns error for actionable errors', () => {
      it('handles disk-space error', () => {
        const result = createRuntimeError(SYSTEM_INSUFFICIENT_DISK_SPACE);
        expect(result).toEqual({
          topic: 'System Error',
          message: 'Insufficient disk space to complete the operation.',
        });
      });

      it('handles out-of-memory error', () => {
        const result = createRuntimeError(SYSTEM_INSUFFICIENT_MEMORY);
        expect(result).toEqual({
          topic: 'System Error',
          message: 'Insufficient memory to complete the operation.',
        });
      });

      it('handles authentication error', () => {
        const result = createRuntimeError(PLATFORM_AUTHENTICATION_ERROR);
        expect(result).toEqual({
          topic: 'Platform Error',
          message: 'Authentication failed. Please check your credentials.',
        });
      });

      it('handles bad credentials error', () => {
        const result = createRuntimeError(PLATFORM_BAD_CREDENTIALS);
        expect(result).toEqual({
          topic: 'Platform Error',
          message:
            'Invalid credentials provided. Please verify your authentication settings.',
        });
      });

      it('handles rate limit exceeded error', () => {
        const result = createRuntimeError(PLATFORM_RATE_LIMIT_EXCEEDED);
        expect(result).toEqual({
          topic: 'Platform Error',
          message: 'Rate limit exceeded. Renovate will retry later.',
        });
      });

      it('handles integration unauthorized error', () => {
        const result = createRuntimeError(PLATFORM_INTEGRATION_UNAUTHORIZED);
        expect(result).toEqual({
          topic: 'Platform Error',
          message: 'Integration is not authorized to access this repository.',
        });
      });

      it('handles external host error without context', () => {
        const result = createRuntimeError(EXTERNAL_HOST_ERROR);
        expect(result).toEqual({
          topic: 'External Host Error',
          message: 'Error connecting to an external host.',
        });
      });

      it('handles external host error with hostType only', () => {
        const result = createRuntimeError(EXTERNAL_HOST_ERROR, {
          hostType: 'npm',
        });
        expect(result).toEqual({
          topic: 'External Host Error',
          message: 'Error connecting to external host: npm.',
        });
      });

      it('handles external host error with hostType and packageName', () => {
        const result = createRuntimeError(EXTERNAL_HOST_ERROR, {
          hostType: 'npm',
          packageName: 'lodash',
        });
        expect(result).toEqual({
          topic: 'External Host Error',
          message: 'Error connecting to npm for package "lodash".',
        });
      });

      it('handles lockfile error', () => {
        const result = createRuntimeError(MANAGER_LOCKFILE_ERROR);
        expect(result).toEqual({
          topic: 'Lockfile Error',
          message:
            'Failed to generate lockfile. Check the logs for more details.',
        });
      });

      it('handles config validation error without context', () => {
        const result = createRuntimeError(CONFIG_VALIDATION);
        expect(result).toEqual({
          topic: 'Configuration Error',
          message:
            'Invalid Renovate configuration. Please check your config file.',
        });
      });

      it('handles config validation error with validation message', () => {
        const result = createRuntimeError(CONFIG_VALIDATION, {
          validationMessage: 'Invalid regex pattern in packageRules',
        });
        expect(result).toEqual({
          topic: 'Configuration Error',
          message: 'Invalid regex pattern in packageRules',
        });
      });

      it('handles config secrets exposed error', () => {
        const result = createRuntimeError(CONFIG_SECRETS_EXPOSED);
        expect(result).toEqual({
          topic: 'Security Error',
          message:
            'Secrets may have been exposed in the repository. Operation aborted for security.',
        });
      });

      it('handles missing api credentials error', () => {
        const result = createRuntimeError(MISSING_API_CREDENTIALS);
        expect(result).toEqual({
          topic: 'Credentials Error',
          message:
            'Missing API credentials for one or more package registries. Please configure the required credentials.',
        });
      });

      it('handles unknown error', () => {
        const result = createRuntimeError(UNKNOWN_ERROR);
        expect(result).toEqual({
          topic: 'Unknown Error',
          message:
            'An unexpected error occurred. Check the logs for more details.',
        });
      });
    });

    describe('returns null for expected states', () => {
      it('returns null for done', () => {
        const result = createRuntimeError('done');
        expect(result).toBeNull();
      });

      it('returns null for automerged', () => {
        const result = createRuntimeError('automerged');
        expect(result).toBeNull();
      });

      it('returns null for repository-disabled', () => {
        const result = createRuntimeError(REPOSITORY_DISABLED);
        expect(result).toBeNull();
      });

      it('returns null for repository-archived', () => {
        const result = createRuntimeError(REPOSITORY_ARCHIVED);
        expect(result).toBeNull();
      });

      it('returns null for temporary-error', () => {
        const result = createRuntimeError(TEMPORARY_ERROR);
        expect(result).toBeNull();
      });
    });
  });
});
