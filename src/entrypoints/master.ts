import config from '../../config.json';
import avatars from '../../res/avatars.json';
import holidays from '../../holidays.json';
import { createLogger } from '../core';
import { MasterWorker } from '../workers/master';

const logger = createLogger(config, `MS (${process.pid})`);
logger.setGlobal();

void new MasterWorker(logger, config, { avatars, holidays }).start();
