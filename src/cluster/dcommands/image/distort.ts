import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { guard } from '@blargbot/cluster/utils';
import { parse } from '@blargbot/core/utils/parse';
import { User } from 'eris';

import { CommandResult } from '../../types';

export class DistortCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `distort`,
            definitions: [
                {
                    parameters: `{user:user+}`,
                    description: `Turns an avatar into modern art.`,
                    execute: (ctx, [user]) => this.renderUser(ctx, user.asUser)
                },
                {
                    parameters: ``,
                    description: `Turns an image into modern art.`,
                    execute: (ctx, _, flags) => this.render(
                        ctx,
                        ctx.message.attachments.length > 0
                            ? ctx.message.attachments[0].url
                            : flags.i?.merge().value
                            ?? ctx.author.avatarURL
                    )
                }
            ],
            flags: [
                { flag: `i`, word: `image`, description: `A custom image.` }
            ]
        });
    }

    public async renderUser(context: CommandContext, user: User): Promise<CommandResult> {
        return await this.render(context, user.avatarURL);
    }

    public async render(context: CommandContext, url: string): Promise<CommandResult> {
        url = parse.url(url);
        if (!guard.isUrl(url))
            return `❌ ${url} is not a valid url!`;

        return await this.renderImage(context, `distort`, { avatar: url });
    }
}
