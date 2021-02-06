import config from "../../config.json";
import { ImageWorker } from './images/ImageWorker';
import { createLogger } from './Logger';

if (process.execArgv[0])
    process.execArgv[0] = process.execArgv[0].replace('-brk', '');

const logger = createLogger(config, 'IM' + (process.env.CLUSTER_ID ?? ''));
const worker = new ImageWorker(logger);

worker.start();