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

e.execute = async function(msg, words) {
    if (words[1]) {
        if (/\<\:.+\:\d+\>/.test(words[1])) {
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
            let codePoint = twemoji.convert.toCodePoint(words[1]);
            let url = `https://raw.githubusercontent.com/twitter/twemoji/gh-pages/2/svg/${codePoint}.svg`;
            request({
                uri: url,
                encoding: null
            }, async function(err, res, body) {
                let size = 668;
                if (words[2]) {
                    let tempSize = parseInt(words[2]);
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
            });
        }
    } else {
        bu.send(msg, 'Not enough arguments!');
    }
};