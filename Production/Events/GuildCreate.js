const { Event } = require('../../Core/Structures');

class GuildCreate extends Event {
    constructor(client) {
        super(client, 'guildCreate');
    }

    async execute(guild) {
        this.client.sender.send('guildCreate', guild.id);
    }
}

module.exports = GuildCreate;