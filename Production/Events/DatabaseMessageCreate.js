const { Event } = require('../../Core/Structures');

class DatabaseMessageCreateEvent extends Event {
    constructor(client) {
        super(client, 'messageCreate', 1);
    }

    async execute(msg) {
        await msg.author.data.updateUser();
        await this.client.Helpers.Message.insertMessage(msg);
    }
}

module.exports = DatabaseMessageCreateEvent;