import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { guard } from '@blargbot/cluster/utils';
import { parse } from '@blargbot/core/utils/parse';
import { User } from 'eris';

import { CommandResult } from '../../types';

export class StarVsTheForcesOfCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `starvstheforcesof`,
            definitions: [
                {
                    parameters: `{user:user+}`,
                    description: `WHO IS STAR BATTLING THIS EPISODE?`,
                    execute: (ctx, [user]) => this.renderUser(ctx, user.asUser)
                },
                {
                    parameters: ``,
                    description: `WHO IS STAR BATTLING THIS EPISODE?`,
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

        return await this.renderImage(context, `starVsTheForcesOf`, { avatar: url });
    }
}
