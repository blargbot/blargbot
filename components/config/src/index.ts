import configJson from '../../../config.json' assert { type: 'json' };
import type { Configuration } from './Configuration.js';

export * from './Configuration.js';

export const config: Configuration = configJson as Configuration;
