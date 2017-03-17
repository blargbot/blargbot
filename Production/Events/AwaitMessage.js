const { Event, Context } = _discord.Core.Structures;

class AwaitMessageEvent extends Event {
    constructor() {
        super('messageCreate', 6);
    }

    async execute(msg) {
        if (_discord.awaitedMessages[msg.channel.id] != undefined) {
            for (const awaited of Object.values(_discord.awaitedMessages[msg.channel.id])) {
                if (awaited.callback(msg) == true) {
                    awaited.execute(msg);
                }
            }
        }
    }
}

module.exports = AwaitMessageEvent;