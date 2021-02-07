import config from '../../config.json';
import avatars from '../../res/avatars.json';
import holidays from '../../holidays.json';
import { createLogger } from '../core/Logger';
import { Master } from '../master/Master';

const logger = createLogger(config, 'MS');
logger.setGlobal();

process.on('unhandledRejection', (err) =>
    logger.error('Unhandled Promise Rejection: Promise' + JSON.stringify(err)));

logger.info(`
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

MAIN PROCESS INITIALIZED

@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`);

void new Master(logger, config, { avatars, holidays })
    .start();