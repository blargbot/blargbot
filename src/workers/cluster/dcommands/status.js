const request = require('request');
const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class StatusCommand extends BaseCommand {
    constructor() {
        super({
            name: 'status',
            category: newbutils.commandTypes.GENERAL,
            usage: 'status <code> [cat | dog]',
            info: 'Gets you an image of an HTTP status code.'
        });
    }

    async execute(msg, words) {
        if (!words[1]) {
            bu.send(msg, '400 BAD REQUEST\nNot enough arguments provided!');
            return;
        }
        let code = parseInt(words[1]);
        if (isNaN(code)) {
            bu.send(msg, '400 BAD REQUEST\nInvalid code provided!');
            return;
        }
        let urlStart;
        if (words[2]) {
            if (words[2].toLowerCase() == 'cat') {
                urlStart = 'https://http.cat/';
            } else if (words[2].toLowerCase() == 'dog') {
                urlStart = 'https://httpstatusdogs.com/img/';
            }
        } else {
            urlStart = bu.getRandomInt(0, 1) == 0 ? 'https://http.cat/' : 'https://httpstatusdogs.com/img/';
        }
        let url = urlStart + encodeURIComponent(code + '.jpg');

        let i = url.lastIndexOf('/');
        if (i != -1) {
            let filename = url.substring(i + 1, url.length);
            request({
                uri: url,
                encoding: null
            }, function (err, res, body) {
                console.debug(res.headers['content-type']);
                if (res.headers['content-type'] == 'text/html') {
                    bu.sendFile(msg.channel.id, '', urlStart + encodeURIComponent(404 + '.jpg'));
                } else
                    bu.send(msg, '', {
                        name: filename,
                        file: body
                    });
            });
        }
    }
}

module.exports = StatusCommand;
