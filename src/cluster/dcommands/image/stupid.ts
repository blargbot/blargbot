import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { guard } from '@blargbot/cluster/utils';

import { CommandResult } from '../../types';

export class StupidCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `stupid`,
            definitions: [
                {
                    parameters: `{text+}`,
                    description: `Tells everyone who is stupid.`,
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
            ],
            flags: [
                { flag: `u`, word: `user`, description: `The person who is stupid.` },
                { flag: `i`, word: `image`, description: `A custom image.` }
            ]
        });
    }

    public async renderUser(context: CommandContext, text: string, userStr: string): Promise<CommandResult> {
        if (!guard.isGuildCommandContext(context))
            return `❌ I could not find the user \`${userStr}\``;

        const result = await context.queryMember({ filter: userStr });
        if (result.state !== `SUCCESS`)
            return `❌ I could not find the user \`${userStr}\``;
        return await this.render(context, text, result.value.user.avatarURL);
    }

    public async render(context: CommandContext, text: string, url: string): Promise<CommandResult> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, `stupid`, { text, avatar: url });
    }
}
