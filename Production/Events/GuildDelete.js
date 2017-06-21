const { Event } = require('../../Core/Structures');

class GuildDelete extends Event {
    constructor(client) {
        super(client, 'guildDelete');
    }

    async execute(guild) {
        this.client.sender.send('guildDelete', guild.id);
    }
}

module.exports = GuildDelete;