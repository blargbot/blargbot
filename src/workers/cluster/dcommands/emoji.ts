import { BaseGlobalCommand } from '@cluster/command';
import { FlagResult } from '@cluster/types';
import { CommandType, parse } from '@cluster/utils';
import { SendPayload } from '@core/types';
import { MessageFile } from 'eris';
import fs from 'fs';
import svg2png from 'svg2png';
import twemoji from 'twemoji';

export class EmojiCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'emoji',
            aliases: ['e'],
            category: CommandType.GENERAL,
            description: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.',
            flags: [{
                flag: 's',
                word: 'svg',
                description: 'Get the emote as an svg instead of a png.'
            }],
            definitions: [
                {
                    parameters: '{emoji} {size:number=668}',
                    execute: (_, [emoji, size], flags) => this.emoji(emoji, size, flags),
                    description: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.'
                }
            ]
        });
    }

    public async emoji(emoji: string, size: number, flags: FlagResult): Promise<MessageFile | SendPayload> {
        const parsedEmojis = parse.emoji(emoji);
        if (parsedEmojis.length === 0)
            return 'No emoji found!';

        const parsedEmoji = parsedEmojis[0];
        if (parsedEmoji.startsWith('a:') || parsedEmoji.startsWith(':')) {
            const id = parse.entityId(parsedEmoji, 'a?:\\w+:', true);
            if (id !== undefined) {
                const url = `https://cdn.discordapp.com/emojis/${id}.${parsedEmoji.startsWith('a') ? 'gif' : 'png'}`;
                return { embed: { image: { url } } };
            }
        }

        try {
            const codePoint = twemoji.convert.toCodePoint(parsedEmoji);
            const file = require.resolve(`twemoji/2/svg/${codePoint}.svg`);
            const body = fs.readFileSync(file);
            if (flags.s !== undefined) {
                return { name: 'emoji.svg', file: body };
            }
            const buffer = await svg2png(body, {
                width: size,
                height: size
            });
            return { name: 'emoji.png', file: buffer };
        } catch {
            return 'Invalid emoji!';
        }

    }
}
