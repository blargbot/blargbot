import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type configJson from '../../config.json';
import type { Configuration } from './Configuration.js';

export * from './Configuration.js';

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);
const buffer = await fs.readFile(path.join(thisDir, '../../config.json'));

export const config: Configuration = JSON.parse(buffer.toString()) as typeof configJson;
