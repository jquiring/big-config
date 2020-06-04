import { cloneDeep, get, merge } from 'lodash';
import * as path from 'path';
import loadFromEnv from './loadFromEnv';
import loadFromFiles from './loadFromFiles';

export interface Options {
  /**
   * The base directory from which to recursively load configurations (default: a
   * directory named `config`, located in the working directory, typically the top level
   * of your project)
   */
  dir?: string;
  /**
   * If true, enable loading from JavaScript files by using require(). This eval-like
   * behavior is deprecated and potentially unsafe. (default: false)
   */
  enableJs?: boolean;
  /**
   * The prefix for environment variable names that will be merged with and override any
   * values loaded from configuration files. (default: CONFIG__).
   */
  prefix?: string;
}

const DEFAULT_OPTIONS: Required<Options> = {
  dir: path.resolve(process.cwd(), 'config'),
  enableJs: false,
  prefix: 'CONFIG__',
};

export class Config {
  public readonly env = process.env.NODE_ENV || 'development';
  private readonly settings: Record<string, unknown>;

  /** Initialize the config system. Synchronously builds the entire config tree. */
  constructor(options?: Options) {
    const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

    const defaultDir = path.resolve(resolvedOptions.dir, 'default');
    const envDir = path.resolve(resolvedOptions.dir, this.env);
    const localDir = path.resolve(resolvedOptions.dir, 'local');

    if (resolvedOptions.enableJs) {
      console.warn(
        '[big-config] enabling potentially unsafe parsing of .js files because the ' +
          'enableJs option is true'
      );
    }

    this.settings = loadFromFiles(defaultDir, resolvedOptions.enableJs);
    this.settings = merge(this.settings, loadFromFiles(envDir, resolvedOptions.enableJs));
    this.settings = merge(
      this.settings,
      loadFromFiles(localDir, resolvedOptions.enableJs)
    );

    this.settings = merge(this.settings, loadFromEnv(resolvedOptions.prefix));
  }

  /** Get the complete settings tree. */
  get(): Record<string, unknown>;
  /** Get a specific setting. A dot-separated path may be used to access nested values. */
  get<T>(key: string): T;
  get<T>(key?: string): T | Record<string, unknown> {
    if (typeof key !== 'string') {
      return cloneDeep(this.settings);
    }
    return cloneDeep(get(this.settings, key) as T);
  }
}
