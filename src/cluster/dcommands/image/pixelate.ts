import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { guard } from '@blargbot/core/utils';
import { parse } from '@blargbot/core/utils/parse';
import { User } from 'eris';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.pixelate;

export class PixelateCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'pixelate',
            flags: [
                { flag: 'i', word: 'image', description: cmd.flags.image },
                { flag: 's', word: 'scale', description: cmd.flags.scale }
            ],
            definitions: [
                {
                    parameters: '{user:user+} {scale:number=64}',
                    description: cmd.user.description,
                    execute: (ctx, [user, scale]) => this.renderUser(ctx, user.asUser, scale.asNumber)
                },
                {
                    parameters: '{scale:number=64}',
                    description: cmd.default.description,
                    execute: (ctx, [scale], flags) => this.render(
                        ctx,
                        ctx.message.attachments.length > 0
                            ? ctx.message.attachments[0].url
                            : flags.i?.merge().value
                            ?? ctx.author.avatarURL,
                        scale.asNumber
                    )
                }
            ]
        });
    }

    public async renderUser(context: CommandContext, user: User, scale: number): Promise<CommandResult> {
        return await this.render(context, user.avatarURL, scale);
    }

    public async render(context: CommandContext, url: string, scale: number): Promise<CommandResult> {
        url = parse.url(url);
        if (!guard.isUrl(url))
            return cmd.default.invalidUrl({ url });

        return await this.renderImage(context, 'pixelate', { url: url, scale });
    }
}
