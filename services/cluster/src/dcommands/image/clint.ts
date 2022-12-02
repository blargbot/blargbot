import { CommandContext, GlobalImageCommand } from '../../command/index.js';
import { guard } from '@blargbot/cluster/utils/index.js';
import { parse } from '@blargbot/core/utils/parse/index.js';
import Eris from 'eris';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.clint;

export class ClintCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'clint',
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
        if (!guard.isUrl(url))
            return cmd.default.invalidUrl({ url });

        return await this.renderImage(context, 'clint', { image: url });
    }
}
