import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { guard } from '@cluster/utils';
import { ImageResult } from '@image/types';
import { User } from 'discord.js';

export class DistortCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'distort',
            definitions: [
                {
                    parameters: '{user:user+}',
                    description: 'Turns an avatar into modern art.',
                    execute: (ctx, [user]) => this.renderUser(ctx, user)
                },
                {
                    parameters: '',
                    description: 'Turns an image into modern art.',
                    execute: (ctx, _, flags) => this.render(
                        ctx,
                        ctx.message.attachments.first()?.url
                        ?? flags.i?.merge().value
                        ?? ctx.author.displayAvatarURL({ dynamic: true, format: 'png' }))
                }
            ],
            flags: [
                { flag: 'i', word: 'image', description: 'A custom image.' }
            ]
        });
    }

    public async renderUser(context: CommandContext, user: User): Promise<ImageResult | string> {
        return await this.render(context, user.displayAvatarURL({ dynamic: true, format: 'png' }));
    }

    public async render(context: CommandContext, url: string): Promise<ImageResult | string> {
        if (!guard.isUrl(url))
            return this.error(`${url} is not a valid url!`);

        return await this.renderImage(context, 'distort', { avatar: url });
    }
}
