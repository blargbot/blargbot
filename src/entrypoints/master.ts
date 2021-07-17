import 'module-alias/register';

import config from '@config';
import { createLogger } from '@core/Logger';
import { MasterWorker } from '@master';
import avatars from '@res/avatars.json';
import holidays from '@res/holidays.json';

const logger = createLogger(config, `MS (${process.pid})`);
logger.setGlobal();

void new MasterWorker(logger, config, { avatars, holidays }).start();
