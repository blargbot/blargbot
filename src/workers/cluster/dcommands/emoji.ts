import fs from 'fs';
import svg2png from 'svg2png';
import twemoji from 'twemoji';
import { MessageFile } from 'eris';
import { BaseGlobalCommand, commandTypes, FlagResult, SendPayload, parse } from '../core';

export class EmojiCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'emoji',
            aliases: ['e'],
            category: commandTypes.GENERAL,
            info: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.',
            flags: [{
                flag: 's',
                word: 'svg',
                desc: 'Get the emote as an svg instead of a png.'
            }],
            definition: {
                parameters: '{emoji} {size?:number}',
                execute: (_, [emoji, size = 668], flags) => this.emoji(emoji, size, flags),
                description: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.'
            }
        });
    }

    public async emoji(emoji: string, size: number, flags: FlagResult): Promise<MessageFile | SendPayload> {
        const parsedEmoji = parse.emoji(emoji)[0];
        if (!parsedEmoji)
            return 'No emoji found!';

        if (parsedEmoji.startsWith('a:') || parsedEmoji.startsWith(':')) {
            const id = parse.entityId(parsedEmoji, 'a?:\\w+:', true);
            if (id !== null) {
                const url = `https://cdn.discordapp.com/emojis/${id}.${parsedEmoji.startsWith('a') ? 'gif' : 'png'}`;
                return { embed: { image: { url } } };
            }
        }

        try {
            const codePoint = twemoji.convert.toCodePoint(parsedEmoji);
            const file = require.resolve(`twemoji/2/svg/${codePoint}.svg`);
            const body = fs.readFileSync(file);
            if (flags.s) {
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