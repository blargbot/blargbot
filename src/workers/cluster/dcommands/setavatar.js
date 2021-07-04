const BaseCommand = require('../structures/BaseCommand');
const request = require('request');
const newbutils = require('../newbu');

class SetavatarCommand extends BaseCommand {
    constructor() {
        super({
            name: 'setavatar',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words) {
        if (msg.author.id === config.discord.users.owner) {

            let avatarUrl = '';
            if (msg.attachments.length > 0) {
                avatarUrl = msg.attachments[0].url;
            } else if (words.length > 1) {
                avatarUrl = words[1];
            } else {
                bu.send(msg, 'No URL given.');
            }
            request.get(avatarUrl, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let data = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64');
                    console.debug(data);
                    let p1 = bot.editSelf({
                        avatar: data
                    });
                    p1.then(function () {
                        bu.send(msg, ':ok_hand: Avatar set!');
                    });
                }
            });
        }
    }
}

module.exports = SetavatarCommand;
