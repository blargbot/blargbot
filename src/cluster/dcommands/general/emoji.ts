import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { Emote } from '@blargbot/core/Emote';
import { SendPayload } from '@blargbot/core/types';
import { mapping } from '@blargbot/mapping';
import { FileContent } from 'eris';
import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';
import twemoji from 'twemoji';

// the .base property is undocumented in the types. Doing this allows us to use it, but detect if it is removed in the future.
const twemojiMap = mapping.object({ base: mapping.string });
const mapped = twemojiMap(twemoji);
const twemojiBase = mapped.valid ? mapped.value.base : 'https://twemoji.maxcdn.com/v/14.0.2/';

export class EmojiCommand extends GlobalCommand {
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
                    execute: (_, [emoji, size], flags) => this.emoji(emoji.asString, size.asNumber, flags.s !== undefined),
                    description: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.'
                }
            ]
        });
    }

    public async emoji(emoji: string, size: number, svg: boolean): Promise<FileContent | SendPayload> {
        const parsedEmojis = Emote.findAll(emoji);
        if (parsedEmojis.length === 0)
            return this.error('No emoji found!');

        const parsedEmoji = parsedEmojis[0];
        if (parsedEmoji.id !== undefined) {
            const url = `https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${parsedEmoji.animated ? 'gif' : 'png'}`;
            return { embeds: [{ image: { url } }] };
        }

        const codePoint = twemoji.convert.toCodePoint(parsedEmoji.name);
        let file = await fetch(path.join(twemojiBase, `svg/${codePoint}.svg`));
        if (file.status === 404) {
            if (codePoint.includes('-fe0f')) // remove variation selector-16 if present
                file = await fetch(path.join(twemojiBase, `svg/${codePoint.replaceAll('-fe0f', '')}.svg`));

            if (file.status === 404)
                return this.error('I dont have an image for that emoji!');
        }
        if (!file.status.toString().startsWith('2'))
            return this.error('Failed to get image for emoji');

        const body = await file.buffer();
        if (svg)
            return { name: 'emoji.svg', file: body };

        const buffer = await sharp(body)
            .resize(size, size)
            .png()
            .toBuffer();
        return { name: 'emoji.png', file: buffer };
    }
}
