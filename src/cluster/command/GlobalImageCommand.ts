import type { CommandOptions, CommandResult } from '@blargbot/cluster';
import { CommandType } from '@blargbot/cluster';
import type { ImageRequest } from '@blargbot/contracts';
import { asBuffer } from '@blargbot/util';
import moment from 'moment-timezone';

import { templates } from '../text.js';
import type { CommandContext } from './CommandContext.js';
import { GlobalCommand } from './GlobalCommand.js';
import { RatelimitMiddleware, SendTypingMiddleware, SingleThreadMiddleware } from './middleware/index.js';

export interface GlobalImageCommandOptions extends Omit<CommandOptions<CommandContext>, 'category'> {
    dontLimitChannel?: boolean;
    ratelimit?: moment.Duration;
}

export abstract class GlobalImageCommand extends GlobalCommand {
    public constructor(options: GlobalImageCommandOptions) {
        super({
            ...options,
            category: CommandType.IMAGE
        });

        if (options.dontLimitChannel !== true)
            this.middleware.push(new SingleThreadMiddleware(c => c.channel.id));
        this.middleware.push(new RatelimitMiddleware(options.ratelimit ?? moment.duration(5, 'seconds'), c => c.author.id));
        this.middleware.push(new SendTypingMiddleware());
    }

    protected async renderImage(context: CommandContext, data: ImageRequest): Promise<CommandResult> {
        const result = await context.cluster.images.render(data);
        if (result === null || result.data.length === 0)
            return templates.commands.$errors.renderFailed;

        return {
            file: [
                {
                    file: asBuffer(result.data),
                    name: result.fileName
                }
            ]
        };
    }
}
