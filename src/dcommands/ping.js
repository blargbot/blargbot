const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

var messages = [
    `Existance is a lie.`,
    `You're going to die some day, perhaps soon.`,
    `Nothing matters.`,
    `Where do you get off?`,
    `There is nothing out there.`,
    `You are all alone in an infinite void.`,
    `Truth is false.`,
    `Forsake everything.`,
    `Your existence is pitiful.`,
    `We are all already dead.`
];

class PingCommand extends BaseCommand {
    constructor() {
        super({
            name: 'ping',
            category: newbutils.commandTypes.GENERAL,
            usage: 'ping',
            info: 'Pong!\nFind the command latency.'
        });
    }

    async execute(msg, words, text) {
        var message = messages[bu.getRandomInt(0, messages.length - 1)];
        let msg2 = await bu.send(msg, message);
        await msg2.edit(`Pong! (${msg2.timestamp - msg.timestamp}ms)`);
    }
}

module.exports = PingCommand;
