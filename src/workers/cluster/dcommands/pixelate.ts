import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { guard } from '@core/utils';
import { ImageResult } from '@image/types';
import { User } from 'discord.js';

export class PixelateCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'pixelate',
            definitions: [
                {
                    parameters: '{user:user+} {scale:number=64}',
                    description: 'Pixelates an image.',
                    execute: (ctx, [user, scale]) => this.renderUser(ctx, user, scale)
                },
                {
                    parameters: '{scale:number=64}',
                    description: 'Pixelates an image.',
                    execute: (ctx, [scale], flags) => this.render(
                        ctx,
                        ctx.message.attachments.first()?.url
                        ?? flags.i?.merge().value
                        ?? ctx.author.displayAvatarURL({ dynamic: true, format: 'png' }),
                        scale
                    )
                }
            ],
            flags: [
                { flag: 'i', word: 'image', description: 'A custom image.' },
                { flag: 's', word: 'scale', description: 'The amount to pixelate by (defaults to 64)' }
            ]
        });
    }

    public async renderUser(context: CommandContext, user: User, scale: number): Promise<ImageResult | string> {
        return await this.render(context, user.displayAvatarURL({ dynamic: true, format: 'png' }), scale);
    }

    public async render(context: CommandContext, url: string, scale: number): Promise<ImageResult | string> {
        if (!guard.isUrl(url))
            return this.error(`\`${url}\` is not a valid url!`);

        return await this.renderImage(context, 'pixelate', { url: url, scale });
    }
}
