import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { guard } from '@cluster/utils';
import { ImageResult } from '@image/types';
import { User } from 'discord.js';

export class LinusCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'linus',
            definitions: [
                {
                    parameters: '{user:user+}',
                    description: 'Shows a picture of Linus pointing at something on his monitor.',
                    execute: (ctx, [user]) => this.renderUser(ctx, user.asUser)
                },
                {
                    parameters: '',
                    description: 'Shows a picture of Linus pointing at something on his monitor.',
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

        return await this.renderImage(context, 'linus', { image: url });
    }
}
