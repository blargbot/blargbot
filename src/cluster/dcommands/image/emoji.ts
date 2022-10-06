import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { Emote } from '@blargbot/core/Emote';
import { ImageResult } from '@blargbot/image/types';

export class EmojiCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `emoji`,
            aliases: [`e`],
            description: `Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.`,
            flags: [{
                flag: `s`,
                word: `svg`,
                description: `Get the emote as an svg instead of a png.`
            }],
            definitions: [
                {
                    parameters: `{emoji} {size:number=668}`,
                    execute: (ctx, [emoji, size], flags) => this.emoji(ctx, emoji.asString, size.asNumber, flags.s !== undefined),
                    description: `Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.`
                }
            ]
        });
    }

    public async emoji(context: CommandContext, emoji: string, size: number, svg: boolean): Promise<string | ImageResult> {
        const parsedEmojis = Emote.findAll(emoji);
        if (parsedEmojis.length === 0)
            return this.error(`No emoji found!`);

        const parsedEmoji = parsedEmojis[0];
        if (parsedEmoji.id !== undefined)
            return `https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${parsedEmoji.animated ? `gif` : `png`}`;

        return await this.renderImage(context, `emoji`, { name: parsedEmoji.name, size, svg });
    }
}
