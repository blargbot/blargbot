import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { guard } from '@cluster/utils';
import { ImageResult } from '@image/types';
import { User } from 'discord.js';

export class ArtCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'art',
            description: 'Shows everyone a work of art.',
            definitions: [
                {
                    parameters: '{user:user+}',
                    description: 'Shows everyone a work of art.',
                    execute: (ctx, [user]) => this.renderUser(ctx, user)
                },
                {
                    parameters: '',
                    description: 'Shows everyone a work of art.',
                    execute: (ctx, _, flags) => this.render(
                        ctx,
                        ctx.message.attachments.first()?.url
                        ?? flags.i?.merge().value
                        ?? ctx.author.displayAvatarURL({ dynamic: true, format: 'png', size: 512 })
                    )
                }
            ],
            flags: [
                { flag: 'i', word: 'image', description: 'A custom image.' }
            ]
        });
    }

    public async renderUser(context: CommandContext, user: User): Promise<string | ImageResult> {
        return await this.render(context, user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 }));
    }

    public async render(context: CommandContext, url: string): Promise<string | ImageResult> {
        if (!guard.isUrl(url))
            return this.error(`${url} is not a valid url!`);

        return await this.renderImage(context, 'art', { avatar: url });
    }
}
