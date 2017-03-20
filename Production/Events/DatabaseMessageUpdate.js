const { Event, Context } = _discord.Core.Structures;

class DatabaseMessageUpdateEvent extends Event {
    constructor() {
        super('messageUpdate', 1);
    }

    async execute(msg, oldMsg) {
        await _discord.Helpers.Message.insertMessage(msg, 1);
    }
}

module.exports = DatabaseMessageUpdateEvent;