import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { guard } from '@blargbot/cluster/utils';
import { parse } from '@blargbot/core/utils/parse';
import { ImageResult } from '@blargbot/image/types';
import { User } from 'eris';

export class LinusCommand extends GlobalImageCommand {
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
        url = parse.url(url);
        if (!guard.isUrl(url))
            return this.error(`${url} is not a valid url!`);

        return await this.renderImage(context, 'linus', { image: url });
    }
}
