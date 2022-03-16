import { ApiWorker } from '@blargbot/api/ApiWorker';
import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/core/Logger';

Error.stackTraceLimit = 100;
const logger = createLogger(config, `API${process.env.WORKER_ID ?? ''}`);
logger.setGlobal();

void new ApiWorker(process, config, logger).start();
