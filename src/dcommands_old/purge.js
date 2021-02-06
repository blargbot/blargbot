const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class PurgeCommand extends BaseCommand {
    constructor() {
        super({
            name: 'purge',
            category: newbutils.commandTypes.ADMIN,
            usage: 'purge',
            info: 'Purges messages made by me.'
        });
    }

    async execute(msg, words, text) {
        //  if (await bu.hasPerm(msg, 'Bot Commander')) {
        bot.getMessages(msg.channel.id, 100)
            .then(function (messageArray) {
                /**
                 * Checks if we have the permissions to remove them all at once
                 */
                var i;
                if (msg.channel.guild.members.get(bot.user.id).permissions.json.manageMessages) {
                    console.debug(`Purging all of my messages in one fell swoop-da-whoop!`);
                    var messageIdArray = [];
                    for (i = 0; i < messageArray.length; i++) {
                        if (messageArray[i].author.id === bot.user.id)
                            messageIdArray.push(messageArray[i].id);
                    }
                    bot.deleteMessages(msg.channel.id, messageIdArray);
                } else {
                    /**
                     * We don't, so we delete them one by one
                     */
                    console.debug(`We're doing this the hard way!`);
                    for (i = 0; i < messageArray.length; i++) {
                        if (messageArray[i].author.id === bot.user.id) {
                            bot.deleteMessage(msg.channel.id, messageArray[i].id);
                        }
                    }
                }
            });
        bu.send(msg, 'Purging!')
            .then(function (message) {
                setTimeout(function () {
                    bot.deleteMessage(msg.channel.id, message.id);
                }, 5000);
            });
        //    }
    }
}

module.exports = PurgeCommand;
