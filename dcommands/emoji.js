var e = module.exports = {};
const twemoji = require('twemoji');
const svg2png = require('svg2png');
const request = require('request');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'emoji <emoji> [size]';
e.alias = ['e'];
e.info = 'Gives you a large version of an emoji. If size is specified, makes the image that size.';
e.longinfo = '<p>Gives you a large version of an emoji. If size is specified, makes the image that size.</p>';
e.flags = [{
    flag: 's',
    word: 'svg',
    desc: 'Get the emote as an svg instead of a png.'
}];


e.execute = async function(msg, words) {
    let input = bu.parseInput(e.flags, words);
    if (input.undefined[0]) {
        if (/\<\:.+\:\d+\>/.test(input.undefined[0])) {
            let url = `https://cdn.discordapp.com/emojis/${words[1].match(/(\d+)/)[1]}.png`;
            request({
                uri: url,
                encoding: null
            }, async function(err, res, body) {
                bu.send(msg, '', {
                    name: 'emoji.png',
                    file: body
                });
            });
        } else {
            let codePoint = twemoji.convert.toCodePoint(input.undefined[0]);
            let url = `https://raw.githubusercontent.com/twitter/twemoji/gh-pages/2/svg/${codePoint}.svg`;
            request({
                uri: url,
                encoding: null
            }, async function(err, res, body) {
                if (input.s) {
                    bu.send(msg, '', {
                        name: 'emoji.svg',
                        file: body
                    });
                } else {
                    let size = 668;
                    if (input.undefined[1]) {
                        let tempSize = parseInt(input.undefined[1]);
                        if (!isNaN(tempSize)) size = tempSize;
                    }
                    if (res.headers['content-type'] == 'text/plain; charset=utf-8') {
                        let buffer = await svg2png(body, {
                            width: size,
                            height: size
                        });
                        bu.send(msg, '', {
                            name: 'emoji.png',
                            file: buffer
                        });
                    } else {
                        bu.send(msg, 'Invalid emoji!');
                    }
                }
            });

        }
    } else {
        bu.send(msg, 'Not enough arguments!');
    }
};