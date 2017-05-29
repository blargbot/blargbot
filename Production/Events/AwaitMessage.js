const { Event } = require('../../Core/Structures');

class AwaitMessageEvent extends Event {
    constructor(client) {
        super('messageCreate', 6);
    }

    async execute(msg) {
        if (this.client.awaitedMessages[msg.channel.id] != undefined) {
            for (const awaited of Object.values(this.client.awaitedMessages[msg.channel.id])) {
                if (awaited.callback(msg) == true) {
                    awaited.execute(msg);
                }
            }
        }
    }
}

module.exports = AwaitMessageEvent;