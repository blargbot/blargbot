const { Event, Context } = _discord.Core.Structures;

class DatabaseMessageCreateEvent extends Event {
    constructor() {
        super('messageCreate', 1);
    }

    async execute(msg) {
        await _discord.Helpers.Message.insertMessage(msg);
    }
}

module.exports = DatabaseMessageCreateEvent;