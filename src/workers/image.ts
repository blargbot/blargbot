import { ImageWorker } from './images/ImageWorker';
import { createLogger } from './images/Logger';

if (process.execArgv[0])
    process.execArgv[0] = process.execArgv[0].replace('-brk', '');

const logger = createLogger(process);
const worker = new ImageWorker(process, logger);

worker.start();