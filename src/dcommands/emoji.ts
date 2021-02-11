import { BaseDCommand } from '../structures/BaseDCommand';

import fs from 'fs';
import svg2png from 'svg2png';
import twemoji from 'twemoji';
import { Cluster } from '../cluster';
import { commandTypes, parse } from '../newbu';
import { Message } from 'eris';

export class EmojiCommand extends BaseDCommand {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'emoji', {
            aliases: ['e'],
            category: commandTypes.GENERAL,
            usage: 'emoji <emoji> [size]',
            info: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.',
            flags: [{
                flag: 's',
                word: 'svg',
                desc: 'Get the emote as an svg instead of a png.'
            }]
        });
    }

    public async execute(msg: Message, words: string[]): Promise<void> {
        const input = parse.flags(this.flags, words);
        if (!input.undefined)
            return void await this.send(msg, 'Not enough arguments!');

        const emoji = parse.emoji(input.undefined[0])[0];
        if (!emoji)
            return void await this.send(msg, 'No emoji found!');

        if (emoji.startsWith('a:') || emoji.startsWith(':')) {
            const id = parse.entityId(emoji, 'a?:\\w+:', true);
            if (id) {
                const url = `https://cdn.discordapp.com/emojis/${id}.${emoji[0] == 'a' ? 'gif' : 'png'}`;
                return void await this.send(msg, { embed: { image: { url } } });
            }
        }

        try {
            const codePoint = twemoji.convert.toCodePoint(emoji);
            const file = require.resolve(`twemoji/2/svg/${codePoint}.svg`);
            const body = fs.readFileSync(file);
            if (input.s) {
                return void await this.send(msg, {}, { name: 'emoji.svg', file: body });
            }
            let size = 668;
            if (input.undefined[1]) {
                const tempSize = parse.int(input.undefined[1]);
                if (!isNaN(tempSize))
                    size = tempSize;
            }
            const buffer = await svg2png(body, {
                width: size,
                height: size
            });
            return void await this.send(msg, {}, { name: 'emoji.png', file: buffer });
        } catch { }

        return void await this.send(msg, 'Invalid emoji!');
    }
}