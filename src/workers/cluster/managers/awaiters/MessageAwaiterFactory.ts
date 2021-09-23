import { Logger } from '@core/Logger';
import { Message } from 'discord.js';

import { AwaiterFactoryBase } from './AwaiterFactoryBase';

export class MessageAwaiterFactory extends AwaiterFactoryBase<Message> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(message: Message): string {
        return message.channel.id;
    }
}
