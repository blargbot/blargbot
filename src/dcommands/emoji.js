const BaseCommand = require('../structures/BaseCommand');
const fs = require('fs');
const path = require('path');
const svg2png = require('svg2png');
const twemoji = require('twemoji');

class EmojiCommand extends BaseCommand {
    constructor() {
        super({
            name: 'emoji',
            aliases: ['e'],
            category: bu.CommandType.GENERAL,
            usage: 'emoji <emoji> [size]',
            info: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.',
            flags: [{
                flag: 's',
                word: 'svg',
                desc: 'Get the emote as an svg instead of a png.'
            }]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
        if (input.undefined) {
            let emoji = bu.findEmoji(input.undefined[0]);
            if (emoji.length > 0) {
                if (emoji[0].startsWith('a:') || emoji[0].startsWith(':')) {
                    let url = `https://cdn.discordapp.com/emojis/${emoji[0].match(/.*:(\d+)/)[1]}.${emoji[0][0] == 'a' ? 'gif' : 'png'}`;
                    bu.send(msg, {
                        embed: {
                            image: {
                                url
                            }
                        }
                    });
                } else {
                    let codePoint = twemoji.convert.toCodePoint(emoji[0]);
                    let file = path.join(__dirname, '..', '..', 'node_modules', 'twemoji', '2', 'svg', codePoint + '.svg');
                    if (fs.existsSync(file)) {
                        let body = fs.readFileSync(file);
                        if (input.s) {
                            bu.send(msg, undefined, {
                                name: 'emoji.svg',
                                file: body
                            });
                        } else {
                            let size = 668;
                            if (input.undefined[1]) {
                                let tempSize = parseInt(input.undefined[1]);
                                if (!isNaN(tempSize)) size = tempSize;
                            }
                            let buffer = await svg2png(body, {
                                width: size,
                                height: size
                            });
                            bu.send(msg, '', {
                                name: 'emoji.png',
                                file: buffer
                            });
                        }
                    } else {
                        bu.send(msg, 'Invalid emoji!');
                    }
                }
            } else {
                bu.send(msg, 'No emoji found!');
            }
        } else {
            bu.send(msg, 'Not enough arguments!');
        }
    }
}

module.exports = EmojiCommand;