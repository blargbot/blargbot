import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { Emote } from '@blargbot/core/Emote';

import templates, { literal } from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.emoji;

export class EmojiCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `emoji`,
            aliases: [`e`],
            description: cmd.description,
            flags: [
                { flag: `s`, word: `svg`, description: cmd.flags.svg }
            ],
            definitions: [
                {
                    parameters: `{emoji} {size:number=668}`,
                    description: cmd.default.description,
                    execute: (ctx, [emoji, size], flags) => this.emoji(ctx, emoji.asString, size.asNumber, flags.s !== undefined)
                }
            ]
        });
    }

    public async emoji(context: CommandContext, emoji: string, size: number, svg: boolean): Promise<CommandResult> {
        const parsedEmojis = Emote.findAll(emoji);
        if (parsedEmojis.length === 0)
            return cmd.default.invalidEmoji;

        const parsedEmoji = parsedEmojis[0];
        if (parsedEmoji.id !== undefined)
            return literal(`https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${parsedEmoji.animated ? `gif` : `png`}`);

        return await this.renderImage(context, `emoji`, { name: parsedEmoji.name, size, svg });
    }
}
