import {
  CONFIG_SECRETS_EXPOSED,
  CONFIG_VALIDATION,
  EXTERNAL_HOST_ERROR,
  MANAGER_LOCKFILE_ERROR,
  MISSING_API_CREDENTIALS,
  NO_VULNERABILITY_ALERTS,
  PLATFORM_AUTHENTICATION_ERROR,
  PLATFORM_BAD_CREDENTIALS,
  PLATFORM_INTEGRATION_UNAUTHORIZED,
  PLATFORM_RATE_LIMIT_EXCEEDED,
  REPOSITORY_ACCESS_FORBIDDEN,
  REPOSITORY_ARCHIVED,
  REPOSITORY_BLOCKED,
  REPOSITORY_CANNOT_FORK,
  REPOSITORY_CHANGED,
  REPOSITORY_DISABLED,
  REPOSITORY_EMPTY,
  REPOSITORY_FORKED,
  REPOSITORY_FORK_MISSING,
  REPOSITORY_FORK_MODE_FORKED,
  REPOSITORY_MIRRORED,
  REPOSITORY_NOT_FOUND,
  REPOSITORY_NO_PACKAGE_FILES,
  REPOSITORY_RENAMED,
  REPOSITORY_UNINITIATED,
  SYSTEM_INSUFFICIENT_DISK_SPACE,
  SYSTEM_INSUFFICIENT_MEMORY,
  TEMPORARY_ERROR,
  UNKNOWN_ERROR,
} from '../../constants/error-messages.ts';
import { ExternalHostError } from '../../types/errors/external-host-error.ts';
import handleError from './error.ts';
import { logger, partial } from '~test/util.ts';
import type { RenovateConfig } from '~test/util.ts';

vi.mock('./error-config.ts');

let config: RenovateConfig;

beforeEach(() => {
  config = partial<RenovateConfig>({ branchList: [], errors: [] });
});

describe('workers/repository/error', () => {
  describe('handleError()', () => {
    const errors = [
      REPOSITORY_UNINITIATED,
      REPOSITORY_EMPTY,
      REPOSITORY_DISABLED,
      REPOSITORY_CHANGED,
      REPOSITORY_FORKED,
      REPOSITORY_FORK_MISSING,
      REPOSITORY_FORK_MODE_FORKED,
      REPOSITORY_NO_PACKAGE_FILES,
      CONFIG_SECRETS_EXPOSED,
      CONFIG_VALIDATION,
      REPOSITORY_ARCHIVED,
      REPOSITORY_MIRRORED,
      REPOSITORY_RENAMED,
      REPOSITORY_BLOCKED,
      REPOSITORY_NOT_FOUND,
      REPOSITORY_ACCESS_FORBIDDEN,
      PLATFORM_BAD_CREDENTIALS,
      PLATFORM_RATE_LIMIT_EXCEEDED,
      MANAGER_LOCKFILE_ERROR,
      MISSING_API_CREDENTIALS,
      SYSTEM_INSUFFICIENT_DISK_SPACE,
      SYSTEM_INSUFFICIENT_MEMORY,
      NO_VULNERABILITY_ALERTS,
      REPOSITORY_CANNOT_FORK,
      PLATFORM_INTEGRATION_UNAUTHORIZED,
      PLATFORM_AUTHENTICATION_ERROR,
      TEMPORARY_ERROR,
    ];
    errors.forEach((err) => {
      it(`errors ${err}`, async () => {
        const res = await handleError(config, new Error(err));
        expect(res).toEqual(err);
      });
    });

    it(`handles ExternalHostError`, async () => {
      const res = await handleError(
        config,
        new ExternalHostError(new Error(), 'some-host-type'),
      );
      expect(res).toEqual(EXTERNAL_HOST_ERROR);
    });

    it('rewrites git 5xx error', async () => {
      const gitError = new Error(
        "fatal: unable to access 'https://**redacted**@gitlab.com/learnox/learnox.git/': The requested URL returned error: 500\n",
      );
      const res = await handleError(config, gitError);
      expect(res).toEqual(EXTERNAL_HOST_ERROR);
    });

    it('rewrites git remote error', async () => {
      const gitError = new Error(
        'fatal: remote error: access denied or repository not exported: /b/nw/bd/27/47/159945428/108610112.git\n',
      );
      const res = await handleError(config, gitError);
      expect(res).toEqual(EXTERNAL_HOST_ERROR);
    });

    it('rewrites git fatal error', async () => {
      const gitError = new Error(
        'fatal: not a git repository (or any parent up to mount point /mnt)\nStopping at filesystem boundary (GIT_DISCOVERY_ACROSS_FILESYSTEM not set).\n',
      );
      const res = await handleError(config, gitError);
      expect(res).toEqual(TEMPORARY_ERROR);
    });

    it('handles unknown error', async () => {
      const res = await handleError(config, new Error('abcdefg'));
      expect(res).toEqual(UNKNOWN_ERROR);
    });

    it('logs config validation errors as warnings by default', async () => {
      const error = new Error(CONFIG_VALIDATION);
      await handleError(config, error);
      expect(logger.logger.warn).toHaveBeenCalledExactlyOnceWith(
        { error },
        'Repository has invalid config',
      );
      expect(logger.logger.error).not.toHaveBeenCalled();
    });

    it('logs config validation errors as warnings when configValidationError is false', async () => {
      const error = new Error(CONFIG_VALIDATION);
      await handleError({ ...config, configValidationError: false }, error);
      expect(logger.logger.warn).toHaveBeenCalledExactlyOnceWith(
        { error },
        'Repository has invalid config',
      );
      expect(logger.logger.error).not.toHaveBeenCalled();
    });

    it('logs config validation errors as errors when configValidationError is true', async () => {
      const error = new Error(CONFIG_VALIDATION);
      await handleError({ ...config, configValidationError: true }, error);
      expect(logger.logger.error).toHaveBeenCalledExactlyOnceWith(
        { error },
        'Repository has invalid config',
      );
      expect(logger.logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('runtime errors to config.errors', () => {
    it('adds error for disk space error', async () => {
      await handleError(config, new Error(SYSTEM_INSUFFICIENT_DISK_SPACE));
      expect(config.errors).toEqual([
        {
          topic: 'System Error',
          message: 'Insufficient disk space to complete the operation.',
        },
      ]);
    });

    it('adds error for out of memory error', async () => {
      await handleError(config, new Error(SYSTEM_INSUFFICIENT_MEMORY));
      expect(config.errors).toEqual([
        {
          topic: 'System Error',
          message: 'Insufficient memory to complete the operation.',
        },
      ]);
    });

    it('adds error for authentication error', async () => {
      await handleError(config, new Error(PLATFORM_AUTHENTICATION_ERROR));
      expect(config.errors).toEqual([
        {
          topic: 'Platform Error',
          message: 'Authentication failed. Please check your credentials.',
        },
      ]);
    });

    it('adds error for bad credentials error', async () => {
      await handleError(config, new Error(PLATFORM_BAD_CREDENTIALS));
      expect(config.errors).toEqual([
        {
          topic: 'Platform Error',
          message:
            'Invalid credentials provided. Please verify your authentication settings.',
        },
      ]);
    });

    it('adds error for rate limit exceeded error', async () => {
      await handleError(config, new Error(PLATFORM_RATE_LIMIT_EXCEEDED));
      expect(config.errors).toEqual([
        {
          topic: 'Platform Error',
          message: 'Rate limit exceeded. Renovate will retry later.',
        },
      ]);
    });

    it('adds error for integration unauthorized error', async () => {
      await handleError(config, new Error(PLATFORM_INTEGRATION_UNAUTHORIZED));
      expect(config.errors).toEqual([
        {
          topic: 'Platform Error',
          message: 'Integration is not authorized to access this repository.',
        },
      ]);
    });

    it('adds error for ExternalHostError with context', async () => {
      const externalHostError = new ExternalHostError(new Error(), 'npm');
      externalHostError.packageName = 'lodash';
      await handleError(config, externalHostError);
      expect(config.errors).toEqual([
        {
          topic: 'External Host Error',
          message: 'Error connecting to npm for package "lodash".',
        },
      ]);
    });

    it('adds error for ExternalHostError with hostType only', async () => {
      await handleError(config, new ExternalHostError(new Error(), 'npm'));
      expect(config.errors).toEqual([
        {
          topic: 'External Host Error',
          message: 'Error connecting to external host: npm.',
        },
      ]);
    });

    it('adds error for lockfile error', async () => {
      await handleError(config, new Error(MANAGER_LOCKFILE_ERROR));
      expect(config.errors).toEqual([
        {
          topic: 'Lockfile Error',
          message:
            'Failed to generate lockfile. Check the logs for more details.',
        },
      ]);
    });

    it('adds error for config validation error', async () => {
      await handleError(config, new Error(CONFIG_VALIDATION));
      expect(config.errors).toEqual([
        {
          topic: 'Configuration Error',
          message:
            'Invalid Renovate configuration. Please check your config file.',
        },
      ]);
    });

    it('adds error for secrets exposed error', async () => {
      await handleError(config, new Error(CONFIG_SECRETS_EXPOSED));
      expect(config.errors).toEqual([
        {
          topic: 'Security Error',
          message:
            'Secrets may have been exposed in the repository. Operation aborted for security.',
        },
      ]);
    });

    it('adds error for missing api credentials error', async () => {
      await handleError(config, new Error(MISSING_API_CREDENTIALS));
      expect(config.errors).toEqual([
        {
          topic: 'Credentials Error',
          message:
            'Missing API credentials for one or more package registries. Please configure the required credentials.',
        },
      ]);
    });

    it('adds error for unknown error', async () => {
      await handleError(config, new Error('some random error'));
      expect(config.errors).toEqual([
        {
          topic: 'Unknown Error',
          message:
            'An unexpected error occurred. Check the logs for more details.',
        },
      ]);
    });

    it('adds error for git 5xx error', async () => {
      const gitError = new Error(
        "fatal: unable to access 'https://**redacted**@gitlab.com/repo.git/': The requested URL returned error: 500\n",
      );
      await handleError(config, gitError);
      expect(config.errors).toEqual([
        {
          topic: 'External Host Error',
          message: 'Error connecting to an external host.',
        },
      ]);
    });

    it('adds error for git remote error', async () => {
      const gitError = new Error(
        'fatal: remote error: access denied or repository not exported: /repo.git\n',
      );
      await handleError(config, gitError);
      expect(config.errors).toEqual([
        {
          topic: 'External Host Error',
          message: 'Error connecting to an external host.',
        },
      ]);
    });

    it('does not add error for repository disabled', async () => {
      await handleError(config, new Error(REPOSITORY_DISABLED));
      expect(config.errors).toEqual([]);
    });

    it('does not add error for repository archived', async () => {
      await handleError(config, new Error(REPOSITORY_ARCHIVED));
      expect(config.errors).toEqual([]);
    });

    it('does not add error for repository changed', async () => {
      await handleError(config, new Error(REPOSITORY_CHANGED));
      expect(config.errors).toEqual([]);
    });

    it('does not add error for temporary error', async () => {
      await handleError(config, new Error(TEMPORARY_ERROR));
      expect(config.errors).toEqual([]);
    });

    it('initializes config.errors if undefined', async () => {
      const configWithoutErrors = partial<RenovateConfig>({ branchList: [] });
      await handleError(configWithoutErrors, new Error(UNKNOWN_ERROR));
      expect(configWithoutErrors.errors).toEqual([
        {
          topic: 'Unknown Error',
          message:
            'An unexpected error occurred. Check the logs for more details.',
        },
      ]);
    });
  });
});
