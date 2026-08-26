import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';
import { MasterWorker } from '@blargbot/master';
import { devAvatars, prdAvatars } from '@blargbot/res';
import fetch from 'node-fetch';

const logger = createLogger(config, 'MS');
logger.setGlobal();

const avatars = config.general.isProd !== true ? devAvatars : prdAvatars;
await avatars.ensureLoaded();

Error.stackTraceLimit = 100;
await new MasterWorker(logger, config, fetch, { avatars: avatars.data })
    .start();
