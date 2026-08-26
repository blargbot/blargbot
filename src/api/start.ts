import { ApiWorker } from '@blargbot/api/ApiWorker.js';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';
import fetch from 'node-fetch';

Error.stackTraceLimit = 100;
const logger = createLogger(config, `API${process.env.WORKER_ID ?? ''}`);
logger.setGlobal();

await new ApiWorker(logger, config, fetch).start();
