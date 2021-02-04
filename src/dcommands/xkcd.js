const BaseCommand = require('../structures/BaseCommand');

var xkcdMax = 0;

async function getXkcd(channel, words) {
    if (xkcdMax === 0) {
        const response = await bu.request('http://xkcd.com/info.0.json');
        xkcdMax = JSON.parse(response.body).num;
        getXkcd(channel, words);
        return;
    }
    var choice;
    if (words.length === 1) {
        choice = bu.getRandomInt(1, xkcdMax);
    } else {
        choice = parseInt(words[1]);
        if (choice > xkcdMax || choice < 0) {
            bu.send(channel, `Comic #${choice} does not exist!`);
        }
    }
    var url = '';
    if (choice === 0) {
        url = 'http://xkcd.com/info.0.json';
    } else {
        url = `http://xkcd.com/${choice}/info.0.json`;
    }
    const response = await bu.request(url);
    let output = JSON.parse(response.body);
    let message = `__**${output.title}, ${output.year}**__
*Comic #${output.num}*
${output.alt}`;
    bu.sendFile(channel, message, output.img);

}

class XkcdCommand extends BaseCommand {
    constructor() {
        super({
            name: 'xkcd',
            category: bu.CommandType.GENERAL,
            usage: 'xkcd [number]',
            info: 'Gets an xkcd comic. If a number is not specified, gets a random one.'
        });
    }

    async execute(msg, words, text) {
        getXkcd(msg.channel.id, words);
    }
}

module.exports = XkcdCommand;
