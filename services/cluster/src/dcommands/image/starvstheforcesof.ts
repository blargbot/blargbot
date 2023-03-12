import { parse } from '@blargbot/core/utils/parse/index.js';
import { isUrl } from '@blargbot/guards';
import type * as Eris from 'eris';

import type { CommandContext } from '../../command/index.js';
import { GlobalImageCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.starVsTheForcesOf;

export class StarVsTheForcesOfCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'starvstheforcesof',
            flags: [
                { flag: 'i', word: 'image', description: cmd.flags.image }
            ],
            definitions: [
                {
                    parameters: '{user:user+}',
                    description: cmd.user.description,
                    execute: (ctx, [user]) => this.renderUser(ctx, user.asUser)
                },
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: (ctx, _, flags) => this.render(
                        ctx,
                        flags.i?.merge().value
                        ?? (ctx.message.attachments.length > 0
                            ? ctx.message.attachments[0].url
                            : ctx.author.avatarURL)
                    )
                }
            ]
        });
    }

    public async renderUser(context: CommandContext, user: Eris.User): Promise<CommandResult> {
        return await this.render(context, user.avatarURL);
    }

    public async render(context: CommandContext, url: string): Promise<CommandResult> {
        url = parse.url(url);
        if (!isUrl(url))
            return cmd.default.invalidUrl({ url });

        return await this.renderImage(context, 'starVsTheForcesOf', { avatar: url });
    }
}
