const { Event, Context } = _discord.Core.Structures;

class DatabaseMessageUpdateEvent extends Event {
    constructor() {
        super('messageUpdate', 1);
    }

    async execute(msg, oldMsg) {
        if (oldMsg == null) {
            msg = await _discord.getMessage(msg.channel.id, msg.id);
            let tempOldMsg = await _discord.Helpers.Message.getLatestCachedMessage(msg.id);
        }
        await _discord.Helpers.Message.insertMessage(msg, 1);
    }
}

module.exports = DatabaseMessageUpdateEvent;