import { BaseGlobalImageCommand, CommandContext } from '@blargbot/cluster/command';
import { guard } from '@blargbot/cluster/utils';
import { ImageResult } from '@blargbot/image/types';
import { User } from 'eris';

export class StarVsTheForcesOfCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'starvstheforcesof',
            definitions: [
                {
                    parameters: '{user:user+}',
                    description: 'WHO IS STAR BATTLING THIS EPISODE?',
                    execute: (ctx, [user]) => this.renderUser(ctx, user.asUser)
                },
                {
                    parameters: '',
                    description: 'WHO IS STAR BATTLING THIS EPISODE?',
                    execute: (ctx, _, flags) => this.render(
                        ctx,
                        flags.i?.merge().value
                        ?? (ctx.message.attachments.length > 0
                            ? ctx.message.attachments[0].url
                            : ctx.author.avatarURL)
                    )
                }
            ],
            flags: [
                { flag: 'i', word: 'image', description: 'A custom image.' }
            ]
        });
    }

    public async renderUser(context: CommandContext, user: User): Promise<ImageResult | string> {
        return await this.render(context, user.avatarURL);
    }

    public async render(context: CommandContext, url: string): Promise<ImageResult | string> {
        if (!guard.isUrl(url))
            return this.error(`${url} is not a valid url!`);

        return await this.renderImage(context, 'starVsTheForcesOf', { avatar: url });
    }
}
