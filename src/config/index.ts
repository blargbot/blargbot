import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type configJson from '../../config.json';
import type { Configuration } from './Configuration.js';

export * from './Configuration.js';

const buffer = await fs.readFile(fileURLToPath(import.meta.resolve('../../config.json')));

export const config: Configuration = JSON.parse(buffer.toString()) as typeof configJson;
