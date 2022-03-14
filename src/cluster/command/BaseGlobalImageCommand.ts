import { CommandOptions } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { ImageGeneratorMap, ImageResult } from '@blargbot/image/types';
import { duration } from 'moment';
import { Duration } from 'moment-timezone';

import { BaseGlobalCommand } from './BaseGlobalCommand';
import { CommandContext } from './CommandContext';
import { RatelimitMiddleware, SingleThreadMiddleware } from './middleware';

export interface GlobalImageCommandOptions extends Omit<CommandOptions<CommandContext>, 'category'> {
    dontLimitChannel?: boolean;
    ratelimit?: Duration;
}

export abstract class BaseGlobalImageCommand extends BaseGlobalCommand {
    public constructor(options: GlobalImageCommandOptions) {
        super({
            ...options,
            category: CommandType.IMAGE
        });

        if (options.dontLimitChannel !== true)
            this.middleware.push(new SingleThreadMiddleware(c => c.channel.id));
        this.middleware.push(new RatelimitMiddleware(options.ratelimit ?? duration(5, 'seconds'), c => c.author.id));
    }

    protected async renderImage<T extends keyof ImageGeneratorMap>(context: CommandContext, command: T, data: ImageGeneratorMap[T]): Promise<ImageResult | string> {
        const promises = [context.channel.sendTyping(), context.cluster.images.render(command, data)] as const;
        const result = await promises[1];
        await promises[0];

        if (result === undefined || result.data.length === 0)
            return this.error('Something went wrong while trying to render that!');
        return result;
    }
}
