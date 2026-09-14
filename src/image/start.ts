import { config } from '@blargbot/config';
import { AmqpConnection, getImageChannel } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';
import { resourceDirectory } from '@blargbot/res';
import { createId } from '@blargbot/util';

import { createImageGenerator } from './createImageGenerator.js';

Error.stackTraceLimit = 100;
const logger = createLogger(config, createId());
logger.setGlobal();

const amqp = new AmqpConnection(config.amqp.url);
const channel = amqp.createChannel();
const imageChannel = await getImageChannel(channel);

const generator = createImageGenerator({
    fetch,
    apiToken: config.blargbotApi.token,
    apiUri: config.blargbotApi.base,
    resourceDirectory
});

await imageChannel.handle(generator);
