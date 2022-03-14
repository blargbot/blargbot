import { BaseGlobalCommand, CommandContext, RatelimitMiddleware, SingleThreadMiddleware } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { ImageResult } from '@blargbot/image/types';
import { duration } from 'moment';

export class FreeCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'free',
            category: CommandType.IMAGE,
            definitions: [
                {
                    parameters: '{caption}',
                    description: 'Tells everyone what you got for free',
                    execute: (ctx, [caption], flags) => this.render(ctx, caption.asString, flags.b?.merge().value)
                }
            ],
            flags: [
                { flag: 'b', word: 'bottom', description: 'The bottom caption.' }
            ]
        });

        this.middleware.push(new SingleThreadMiddleware(c => c.channel.id));
        this.middleware.push(new RatelimitMiddleware(duration(5, 'seconds'), c => c.author.id));
    }

    public async render(context: CommandContext, caption: string, bottomText: string | undefined): Promise<string | ImageResult> {
        await context.channel.sendTyping();

        const result = await context.cluster.images.render('free', {
            top: caption,
            bottom: bottomText
        });

        if (result === undefined || result.data.length === 0)
            return this.error('Something went wrong while trying to render that!');

        return result;
    }
}
