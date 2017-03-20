const { Event, Context } = _discord.Core.Structures;

class DatabaseMessageDeleteEvent extends Event {
    constructor() {
        super('messageDelete', 1);
    }

    async execute(msg) {
        await _discord.Helpers.Message.insertMessage(msg, 2);
    }
}

module.exports = DatabaseMessageDeleteEvent;