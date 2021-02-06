const BaseCommand = require('../structures/BaseCommand');
const request = require('request');
const newbutils = require('../newbu');

class EmojifyCommand extends BaseCommand {
    constructor() {
        super({
            name: 'emojify',
            aliases: ['💬'],
            category: newbutils.commandTypes.GENERAL,
            usage: 'emojify <text>',
            info: 'Gets emojis based on input.'
        });
    }

    async execute(msg, words, text) {
        var options = {
            uri: 'https://emoji.getdango.com/api/emoji?q=' + encodeURIComponent(words.splice(1, words.length).join(' ')),
            headers: {
                'User-Agent': 'blargbot/1.0 (ratismal)'
            }
        };
        request(options, (err, res, body) => {
            if (!err && res.statusCode == 200) {
                var emojis = JSON.parse(body);
                var toSend = '';
                for (var i = 0; i < emojis.results.length && i < 8; i++) {
                    toSend += emojis.results[i].text;
                }
                bu.send(msg, toSend);
            }
        });
    }
}

module.exports = EmojifyCommand;
