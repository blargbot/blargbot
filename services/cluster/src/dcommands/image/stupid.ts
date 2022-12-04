import { guard } from '@blargbot/cluster/utils/index.js';

import type { CommandContext} from '../../command/index.js';
import { GlobalImageCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.stupid;

export class StupidCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'stupid',
            flags: [
                { flag: 'u', word: 'user', description: cmd.flags.user },
                { flag: 'i', word: 'image', description: cmd.flags.image }
            ],
            definitions: [
                {
                    parameters: '{text+}',
                    description: cmd.default.description,
                    execute: (ctx, [text], flags) => flags.u !== undefined
                        ? this.renderUser(ctx, text.asString, flags.u.merge().value)
                        : this.render(
                            ctx,
                            text.asString,
                            flags.i?.merge().value
                            ?? (ctx.message.attachments.length > 0
                                ? ctx.message.attachments[0].url
                                : ctx.author.avatarURL)
                        )
                }
            ]
        });
    }

    public async renderUser(context: CommandContext, text: string, userStr: string): Promise<CommandResult> {
        if (!guard.isGuildCommandContext(context))
            return cmd.default.invalidUser({ user: userStr });

        const result = await context.queryMember({ filter: userStr });
        if (result.state !== 'SUCCESS')
            return cmd.default.invalidUser({ user: userStr });
        return await this.render(context, text, result.value.user.avatarURL);
    }

    public async render(context: CommandContext, text: string, url: string): Promise<CommandResult> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'stupid', { text, avatar: url });
    }
}
