const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class ShipCommand extends BaseCommand {
    constructor() {
        super({
            name: 'ship',
            category: newbutils.commandTypes.GENERAL,
            usage: 'ship <user1> <user2>',
            info: 'Gives you the ship name for two users.'
        });
    }

    async execute(msg, words, text) {
        if (words.length > 2) {
            let users = [await bu.getUser(msg, words[1]), await bu.getUser(msg, words[2])];
            if (!users[0] || !users[1]) {
                return;
            }
            bu.shuffle(users);
            let firstPart = users[0].username.substring(0, users[0].username.length / 2);
            let lastPart = users[1].username.substring(users[1].username.length / 2);
            bu.send(msg, `Your shipname is **${firstPart}${lastPart}**!`);
        } else {
            bu.send(msg, 'You have to tell me who you want to ship!');
        }
    }
}

module.exports = ShipCommand;
