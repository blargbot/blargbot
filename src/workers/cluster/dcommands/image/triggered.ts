import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { guard } from '@cluster/utils';
import { ImageResult, TriggeredOptions } from '@image/types';
import { User } from 'discord.js';

export class TriggeredCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'triggered',
            definitions: [
                {
                    parameters: '{user:user+}',
                    description: 'Shows everyone how triggered you are.',
                    execute: (ctx, [user], flags) => this.renderUser(ctx, user.asUser, {
                        blur: flags.b !== undefined,
                        greyscale: flags.g !== undefined,
                        horizontal: flags.h !== undefined,
                        inverted: flags.n !== undefined,
                        sepia: flags.s !== undefined,
                        vertical: flags.v !== undefined
                    })
                },
                {
                    parameters: '',
                    description: 'Shows everyone how triggered you are.',
                    execute: (ctx, _, flags) => this.render(ctx, {
                        avatar: flags.i?.merge().value
                            ?? ctx.message.attachments.first()?.url
                            ?? ctx.author.displayAvatarURL({ dynamic: true, format: 'png', size: 512 }),
                        blur: flags.b !== undefined,
                        greyscale: flags.g !== undefined,
                        horizontal: flags.h !== undefined,
                        inverted: flags.n !== undefined,
                        sepia: flags.s !== undefined,
                        vertical: flags.v !== undefined
                    })
                }
            ],
            flags: [
                { flag: 'i', word: 'image', description: 'A custom image.' },
                { flag: 'n', word: 'negative', description: 'Gets the negative of the image.' },
                { flag: 'h', word: 'horizontal', description: 'Flips the image horizontally.' },
                { flag: 'v', word: 'vertical', description: 'Flips the image vertically.' },
                { flag: 's', word: 'sepia', description: 'Applies a sepia filter.' },
                { flag: 'b', word: 'blur', description: 'Applies a blur.' },
                { flag: 'g', word: 'greyscale', description: 'Makes the image greyscale' }
            ]
        });
    }

    public async renderUser(context: CommandContext, user: User, options: Omit<TriggeredOptions, 'avatar'>): Promise<ImageResult | string> {
        return await this.render(context, {
            ...options,
            avatar: user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 })
        });
    }

    public async render(context: CommandContext, options: TriggeredOptions): Promise<ImageResult | string> {
        if (!guard.isUrl(options.avatar))
            return this.error(`${options.avatar} is not a valid url!`);

        return await this.renderImage(context, 'triggered', options);
    }
}
