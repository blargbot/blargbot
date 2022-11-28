import { CommandOptions, CommandResult } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { ImageGeneratorMap } from '@blargbot/image/types';
import { Duration, duration } from 'moment-timezone';

import templates from '../text';
import { CommandContext } from './CommandContext';
import { GlobalCommand } from './GlobalCommand';
import { RatelimitMiddleware, SendTypingMiddleware, SingleThreadMiddleware } from './middleware/index';

export interface GlobalImageCommandOptions extends Omit<CommandOptions<CommandContext>, 'category'> {
    dontLimitChannel?: boolean;
    ratelimit?: Duration;
}

export abstract class GlobalImageCommand extends GlobalCommand {
    public constructor(options: GlobalImageCommandOptions) {
        super({
            ...options,
            category: CommandType.IMAGE
        });

        if (options.dontLimitChannel !== true)
            this.middleware.push(new SingleThreadMiddleware(c => c.channel.id));
        this.middleware.push(new RatelimitMiddleware(options.ratelimit ?? duration(5, 'seconds'), c => c.author.id));
        this.middleware.push(new SendTypingMiddleware());
    }

    protected async renderImage<T extends keyof ImageGeneratorMap>(context: CommandContext, command: T, data: ImageGeneratorMap[T]): Promise<CommandResult> {
        const result = await context.cluster.images.render(command, data);
        if (result === undefined || result.data.length === 0)
            return templates.commands.$errors.renderFailed;

        return {
            file: [
                {
                    file: result.data,
                    name: result.fileName
                }
            ]
        };
    }
}
