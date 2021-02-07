import config from '../../config.json';
import { ImageWorker } from '../workers/ImageWorker';
import { createLogger } from '../workers/Logger';

if (process.execArgv[0])
    process.execArgv[0] = process.execArgv[0].replace('-brk', '');

const logger = createLogger(config, 'IM' + (process.env.CLUSTER_ID ?? ''));
const worker = new ImageWorker(logger);

void worker.start();