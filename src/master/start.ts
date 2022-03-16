import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/core/Logger';
import { MasterWorker } from '@blargbot/master';
import devAvatars from '@blargbot/res/avatars.dev.json';
import prdAvatars from '@blargbot/res/avatars.prd.json';
import holidays from '@blargbot/res/holidays.json';

const logger = createLogger(config, 'MS');
logger.setGlobal();

const avatars = config.general.isProd !== true ? devAvatars : prdAvatars;

Error.stackTraceLimit = 100;
void new MasterWorker(process, logger, config, { avatars, holidays })
    .start();
