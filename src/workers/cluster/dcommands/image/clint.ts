import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { guard } from '@cluster/utils';
import { ImageResult } from '@image/types';
import { User } from 'discord.js';

export class ClintCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'clint',
            definitions: [
                {
                    parameters: '{user:user+}',
                    description: 'I don\'t even know, to be honest.',
                    execute: (ctx, [user]) => this.renderUser(ctx, user.asUser)
                },
                {
                    parameters: '',
                    description: 'I don\'t even know, to be honest.',
                    execute: (ctx, _, flags) => this.render(
                        ctx,
                        flags.i?.merge().value
                        ?? ctx.message.attachments.first()?.url
                        ?? ctx.author.displayAvatarURL({ dynamic: true, format: 'png', size: 512 })
                    )
                }
            ],
            flags: [
                { flag: 'i', word: 'image', description: 'A custom image.' }
            ]
        });
    }

    public async renderUser(context: CommandContext, user: User): Promise<ImageResult | string> {
        return await this.render(context, user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 }));
    }

    public async render(context: CommandContext, url: string): Promise<ImageResult | string> {
        if (!guard.isUrl(url))
            return this.error(`${url} is not a valid url!`);

        return await this.renderImage(context, 'clint', { image: url });
    }
}
